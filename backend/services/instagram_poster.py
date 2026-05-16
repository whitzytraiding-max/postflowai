import json
import time
import random
from instagrapi import Client


# Realistic mid-range Android device fingerprint
_DEVICE = {
    "app_version": "269.0.0.18.75",
    "android_version": 31,
    "android_release": "12",
    "dpi": "420dpi",
    "resolution": "1080x2340",
    "manufacturer": "samsung",
    "device": "SM-G991B",
    "model": "SM-G991B",
    "cpu": "exynos2100",
    "version_code": "314665256",
}


def _warmup(cl: Client):
    """Simulate normal app activity before posting."""
    try:
        time.sleep(random.uniform(3, 8))
        cl.get_timeline_feed()
        time.sleep(random.uniform(5, 15))
        cl.account_info()
        time.sleep(random.uniform(8, 25))
    except Exception:
        pass


def post_to_instagram(local_path: str, caption: str, credentials_json: str) -> str:
    """Post video to Instagram as a Reel. Returns post URL or raises."""
    creds = json.loads(credentials_json)
    session_id = creds.get("session_id", "")

    if not session_id:
        raise ValueError("No Instagram session_id in credentials")

    cl = Client()
    cl.set_device(_DEVICE)
    cl.set_user_agent(
        f"Instagram {_DEVICE['app_version']} Android ({_DEVICE['android_version']}/"
        f"{_DEVICE['android_release']}; {_DEVICE['dpi']}; {_DEVICE['resolution']}; "
        f"{_DEVICE['manufacturer']}; {_DEVICE['device']}; {_DEVICE['cpu']}; en_US; "
        f"{_DEVICE['version_code']})"
    )
    cl.login_by_sessionid(session_id)

    _warmup(cl)

    media = cl.clip_upload(local_path, caption=caption)
    return f"https://www.instagram.com/reel/{media.code}/"
