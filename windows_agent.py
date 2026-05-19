"""
PostFlow AI — Windows Download Agent
Run this on your Windows PC (residential IP) to handle YouTube downloads.

Install deps:  pip install yt-dlp requests
Run:           python windows_agent.py
"""

import os
import glob
import time
import tempfile
import requests
import yt_dlp

# ── Config ──────────────────────────────────────────────────────────────────
RENDER_URL = "https://postflow-ai-backend.onrender.com"
API_KEY    = "YOUR_API_KEY_HERE"   # get this from the PostFlow dashboard
HEADERS    = {"X-API-Key": API_KEY}
POLL_EVERY = 60   # seconds between polls

# Browser to read YouTube cookies from (fixes 467 bot-detection errors).
# yt-dlp reads cookies directly from the installed browser — no export needed.
# Change to "firefox" or "edge" if you don't use Chrome.
BROWSER = "chrome"
# ────────────────────────────────────────────────────────────────────────────


def fetch_pending():
    try:
        r = requests.get(f"{RENDER_URL}/pipeline/pending-downloads",
                         headers=HEADERS, timeout=15)
        return r.json() if r.ok else []
    except Exception as e:
        print(f"[Agent] Poll error: {e}")
        return []


def download_video(url: str, video_id: str, tmpdir: str) -> str | None:
    out_path = os.path.join(tmpdir, f"{video_id}.%(ext)s")
    base_opts = {
        "outtmpl": out_path,
        "format": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "merge_output_format": "mp4",
        "quiet": False,
        "no_warnings": True,
    }

    # Try with browser cookies first (bypasses YouTube 467 bot detection),
    # then fall back to no cookies.
    attempts = [
        {**base_opts, "cookiesfrombrowser": (BROWSER,)},
        base_opts,
    ]

    for i, opts in enumerate(attempts):
        # Clean up any partial files from a previous attempt
        for f in glob.glob(os.path.join(tmpdir, f"{video_id}.*")):
            os.remove(f)
        label = f"{BROWSER} cookies" if i == 0 else "no cookies"
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.extract_info(url, download=True)
            matches = glob.glob(os.path.join(tmpdir, f"{video_id}.*"))
            if matches and os.path.getsize(matches[0]) > 0:
                print(f"[Agent] Downloaded OK ({label}): {matches[0]}")
                return matches[0]
        except Exception as e:
            print(f"[Agent] Download failed ({label}): {e}")
            continue

    print(f"[Agent] All download attempts failed for {video_id}")
    return None


def deliver(video_id: str, local_path: str) -> bool:
    filename = os.path.basename(local_path)
    size_mb = os.path.getsize(local_path) / 1024 / 1024
    print(f"[Agent] Uploading {filename} ({size_mb:.1f} MB) to Render...")
    try:
        with open(local_path, "rb") as f:
            r = requests.post(
                f"{RENDER_URL}/pipeline/{video_id}/deliver",
                headers=HEADERS,
                files={"file": (filename, f, "video/mp4")},
                timeout=600,
            )
        if r.ok:
            print(f"[Agent] Delivered {video_id}: {r.json()}")
            return True
        else:
            print(f"[Agent] Deliver failed {r.status_code}: {r.text}")
            return False
    except Exception as e:
        print(f"[Agent] Upload error: {e}")
        return False


def main():
    print(f"[Agent] PostFlow Windows agent started. Polling every {POLL_EVERY}s...")
    print(f"[Agent] Using {BROWSER} cookies for YouTube downloads.")
    while True:
        videos = fetch_pending()
        if videos:
            print(f"[Agent] {len(videos)} video(s) to download")
            for v in videos:
                print(f"[Agent] Downloading: {v['title']} ({v['id']})")
                with tempfile.TemporaryDirectory() as tmpdir:
                    path = download_video(v["original_url"], v["id"], tmpdir)
                    if path:
                        deliver(v["id"], path)
        else:
            print(f"[Agent] Nothing pending. Next check in {POLL_EVERY}s...")

        time.sleep(POLL_EVERY)


if __name__ == "__main__":
    main()
