import os
import json
from urllib.parse import urlparse
import httplib2
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from services.exceptions import BannedAccountError


def _build_youtube_client(creds, proxy_url: str):
    if not proxy_url:
        return build("youtube", "v3", credentials=creds)
    parsed = urlparse(proxy_url)
    proxy_info = httplib2.ProxyInfo(
        proxy_type=httplib2.socks.PROXY_TYPE_HTTP,
        proxy_host=parsed.hostname,
        proxy_port=parsed.port or 80,
        proxy_rdns=True,
        proxy_user=parsed.username or None,
        proxy_pass=parsed.password or None,
    )
    http = creds.authorize(httplib2.Http(proxy_info=proxy_info))
    return build("youtube", "v3", http=http)


def post_to_youtube(local_path: str, title: str, caption: str, credentials_json: str) -> str:
    """Upload video to YouTube. Returns video URL or raises."""
    creds_data = json.loads(credentials_json)

    creds = Credentials(
        token=creds_data.get("access_token"),
        refresh_token=creds_data.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=creds_data.get("client_id"),
        client_secret=creds_data.get("client_secret"),
    )

    # Refresh if expired
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())

    youtube = _build_youtube_client(creds, creds_data.get("proxy_url", ""))

    body = {
        "snippet": {
            "title": title[:100],
            "description": caption,
            "tags": [],
            "categoryId": "22",
        },
        "status": {
            "privacyStatus": "public",
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(local_path, mimetype="video/mp4", resumable=True)

    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
    try:
        response = request.execute()
    except HttpError as e:
        content = e.content.decode("utf-8", errors="ignore").lower() if e.content else ""
        if e.status_code in (401, 403) and any(k in content for k in ("suspended", "disabled", "terminated", "forbidden", "caller does not have permission")):
            raise BannedAccountError("youtube", f"Account suspended or revoked (HTTP {e.status_code}): {content[:200]}")
        raise
    video_id = response["id"]
    return f"https://www.youtube.com/shorts/{video_id}"
