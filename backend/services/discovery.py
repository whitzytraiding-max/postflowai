import re
import yt_dlp
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import Source, QueuedVideo

try:
    from langdetect import detect
    from langdetect.detector_factory import DetectorFactory
    DetectorFactory.seed = 42  # make results deterministic
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False


def _detect_stable(text: str):
    """Run langdetect 3 times, return the majority result."""
    try:
        results = [detect(text) for _ in range(3)]
        return max(set(results), key=results.count)
    except Exception:
        return None

# Unicode ranges for scripts that are unique to a language/family.
# Languages that share the Latin script (en/es/fr/pt/de/id/tr) need langdetect instead.
_SCRIPT_LANGS = {
    "ar": [(0x0600, 0x06FF), (0x0750, 0x077F)],  # Arabic
    "he": [(0x0590, 0x05FF)],                      # Hebrew
    "hi": [(0x0900, 0x097F)],                      # Devanagari (Hindi/Marathi)
    "ru": [(0x0400, 0x04FF)],                      # Cyrillic (Russian/Ukrainian)
    "zh": [(0x4E00, 0x9FFF), (0x3400, 0x4DBF), (0x20000, 0x2A6DF)],  # CJK
    "ja": [(0x3040, 0x30FF)],                      # Hiragana + Katakana
    "ko": [(0xAC00, 0xD7AF), (0x1100, 0x11FF)],   # Hangul
    "th": [(0x0E00, 0x0E7F)],                      # Thai
    "vi": None,                                    # Vietnamese — Latin + diacritics, use langdetect
    "tr": None,
    "id": None,
    "es": None,
    "fr": None,
    "pt": None,
    "de": None,
    "en": None,
}

_LATIN_LANGS = {lang for lang, ranges in _SCRIPT_LANGS.items() if ranges is None}


def _clean_title(title: str) -> str:
    # Remove hashtags, URLs, emojis, and extra whitespace — leaves actual words
    text = re.sub(r"#\S+", "", title)
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _dominant_script(text: str) -> str:
    """Return a script-based language code if the text is clearly non-Latin, else None."""
    if not text:
        return None
    counts = {lang: 0 for lang in _SCRIPT_LANGS if _SCRIPT_LANGS[lang]}
    total = 0
    for ch in text:
        cp = ord(ch)
        for lang, ranges in _SCRIPT_LANGS.items():
            if not ranges:
                continue
            for lo, hi in ranges:
                if lo <= cp <= hi:
                    counts[lang] += 1
                    total += 1
    if total == 0 or total < 3:
        return None
    best_lang = max(counts, key=counts.get)
    if counts[best_lang] / max(len(text), 1) > 0.25:
        return best_lang
    return None


def _language_matches(title: str, required_lang: str) -> bool:
    if required_lang == "any":
        return True

    dominant = _dominant_script(title)

    # If the target language uses a unique non-Latin script (ar, zh, hi, ru, ko, ja...)
    # do an exact script match — very reliable
    if required_lang not in _LATIN_LANGS:
        if dominant is None:
            return False  # title is Latin-script, wanted non-Latin → reject
        return dominant == required_lang

    # Target language uses Latin script (en, es, fr, pt, de, id, tr...)
    # Rule: if title contains significant non-Latin script chars → reject
    # Otherwise allow through — langdetect is too unreliable on short financial titles
    if dominant is not None:
        return False  # title is clearly Arabic/Chinese/etc., wanted Latin → reject

    return True  # Latin-script title, Latin-script target language → allow


def discover_videos_for_source(source: Source, db: Session) -> list:
    tag = source.tag.strip()
    tag_clean = tag.lstrip("#")
    language = getattr(source, "language", "any") or "any"
    # Pull more candidates to compensate for language filtering dropping some
    fetch_count = source.videos_per_day * 6

    if source.platform == "tiktok":
        search_url = f"tiktok:{tag}"
    elif source.platform == "instagram":
        search_url = f"https://www.instagram.com/explore/tags/{tag_clean}/"
    else:  # youtube — search filtered to Shorts only (sp=EgIYAQ== is YouTube's Shorts filter)
        search_url = f"https://www.youtube.com/results?search_query={tag_clean}&sp=EgIYAQ%3D%3D"

    ydl_opts = {
        "extract_flat": True,
        "quiet": True,
        "no_warnings": True,
        "playlistend": fetch_count,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(search_url, download=False)
    except Exception as e:
        print(f"[Discovery] yt-dlp error for source {source.id}: {e}")
        return []

    if not info:
        return []

    entries = info.get("entries", [info] if "id" in info else [])

    cutoff_date = datetime.utcnow() - timedelta(days=source.max_age_days)

    # Dedup against queue AND post history so nothing ever gets double-posted
    from models import PostHistory
    queued_urls = {
        row.original_url
        for row in db.query(QueuedVideo.original_url)
        .filter(QueuedVideo.user_id == source.user_id)
        .all()
    }
    posted_urls = {
        qv.original_url
        for qv in db.query(QueuedVideo).join(
            PostHistory, PostHistory.queued_video_id == QueuedVideo.id
        ).filter(
            PostHistory.user_id == source.user_id,
            PostHistory.status == "success",
        ).all()
    }
    existing_urls = queued_urls | posted_urls

    created = []
    added_count = 0

    for entry in entries:
        if entry is None:
            continue
        if added_count >= source.videos_per_day:
            break

        view_count = entry.get("view_count") or 0
        like_count = entry.get("like_count") or 0

        if view_count < source.min_views:
            continue

        if source.platform == "youtube":
            entry_url = entry.get("url") or entry.get("webpage_url") or ""
            duration = entry.get("duration") or 0
            is_short = "/shorts/" in entry_url or (0 < duration <= 60)
            if not is_short:
                continue

        upload_date_str = entry.get("upload_date")
        if upload_date_str:
            try:
                upload_date = datetime.strptime(upload_date_str, "%Y%m%d")
                if upload_date < cutoff_date:
                    continue
            except ValueError:
                pass

        title = entry.get("title") or entry.get("id") or ""

        if not _language_matches(title, language):
            print(f"[Discovery] Language filter dropped: {title[:60]!r} (wanted {language})")
            continue

        video_url = entry.get("url") or entry.get("webpage_url") or entry.get("id")
        if not video_url or video_url in existing_urls:
            continue

        video = QueuedVideo(
            user_id=source.user_id,
            source_id=source.id,
            original_url=video_url,
            platform=source.platform,
            title=title or "Untitled",
            thumbnail_url=entry.get("thumbnail"),
            view_count=view_count,
            like_count=like_count,
            status="pending",
            post_to_platform=source.post_to_platform,
        )
        db.add(video)
        existing_urls.add(video_url)
        created.append(video)
        added_count += 1

    db.commit()
    for v in created:
        db.refresh(v)

    return created
