import os
import glob
import tempfile
import imageio_ffmpeg
import yt_dlp
from pathlib import Path

DOWNLOAD_DIR = Path.home() / ".postflow" / "downloads"
FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()

# android_vr/ios broken as of mid-2025; web + android work reliably
CLIENTS = ["web", "android", "android_testsuite"]


def _get_cookie_file() -> str | None:
    """Return path to YouTube cookies file (Render secret file or base64 env var fallback)."""
    secret_path = "/etc/secrets/youtube_cookies.txt"
    if os.path.exists(secret_path):
        return secret_path
    raw = os.environ.get("YOUTUBE_COOKIES", "").strip()
    if not raw:
        return None
    import base64
    try:
        content = base64.b64decode(raw).decode("utf-8")
    except Exception:
        content = raw  # assume it's already plaintext
    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False)
    tmp.write(content)
    tmp.close()
    return tmp.name


def download_video(video_url: str, video_id: str) -> str:
    """Download video using bundled ffmpeg. Uses YouTube cookies if YOUTUBE_COOKIES is set."""
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    out_path = str(DOWNLOAD_DIR / f"{video_id}.%(ext)s")
    cookie_file = _get_cookie_file()

    last_error = None

    for client in CLIENTS:
        for f in glob.glob(str(DOWNLOAD_DIR / f"{video_id}.*")):
            os.remove(f)

        opts = {
            "outtmpl": out_path,
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[ext=mp4]/best",
            "merge_output_format": "mp4",
            "ffmpeg_location": FFMPEG_PATH,
            "quiet": True,
            "no_warnings": True,
            "extractor_args": {"youtube": {"player_client": [client]}},
        }

        if cookie_file:
            opts["cookiefile"] = cookie_file

        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.extract_info(video_url, download=True)

            matches = glob.glob(str(DOWNLOAD_DIR / f"{video_id}.*"))
            if matches and os.path.getsize(matches[0]) > 0:
                print(f"[Downloader] Success with client={client}: {matches[0]}")
                return matches[0]

        except Exception as e:
            last_error = e
            print(f"[Downloader] client={client} failed: {e}")
            continue

    raise ValueError(f"Download failed with all clients: {last_error}")
