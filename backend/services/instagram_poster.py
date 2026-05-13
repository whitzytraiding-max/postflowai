import json
from instagrapi import Client


def post_to_instagram(local_path: str, caption: str, credentials_json: str) -> str:
    """Post video to Instagram as a Reel. Returns post URL or raises."""
    creds = json.loads(credentials_json)
    session_id = creds.get("session_id", "")

    if not session_id:
        raise ValueError("No Instagram session_id in credentials")

    cl = Client()
    cl.login_by_sessionid(session_id)

    media = cl.clip_upload(local_path, caption=caption)
    return f"https://www.instagram.com/reel/{media.code}/"
