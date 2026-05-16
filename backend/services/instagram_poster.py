import json
import time
import random
import hashlib
from instagrapi import Client

# Pool of realistic Android devices. Each account gets one derived
# deterministically from its session_id so the same account always
# appears as the same physical device across posts.
_DEVICE_POOL = [
    {
        "manufacturer": "samsung", "device": "SM-G991B", "model": "SM-G991B",
        "cpu": "exynos2100", "android_version": 31, "android_release": "12",
        "dpi": "420dpi", "resolution": "1080x2340",
    },
    {
        "manufacturer": "samsung", "device": "SM-A525F", "model": "SM-A525F",
        "cpu": "qcom", "android_version": 33, "android_release": "13",
        "dpi": "360dpi", "resolution": "1080x2400",
    },
    {
        "manufacturer": "xiaomi", "device": "2201116TG", "model": "2201116TG",
        "cpu": "qcom", "android_version": 32, "android_release": "12",
        "dpi": "440dpi", "resolution": "1080x2400",
    },
    {
        "manufacturer": "xiaomi", "device": "22071212AG", "model": "22071212AG",
        "cpu": "qcom", "android_version": 33, "android_release": "13",
        "dpi": "395dpi", "resolution": "1080x2400",
    },
    {
        "manufacturer": "motorola", "device": "motorola edge 30", "model": "tesla",
        "cpu": "qcom", "android_version": 32, "android_release": "12",
        "dpi": "400dpi", "resolution": "1080x2400",
    },
    {
        "manufacturer": "motorola", "device": "moto g82 5G", "model": "rhodei",
        "cpu": "qcom", "android_version": 31, "android_release": "12",
        "dpi": "300dpi", "resolution": "1080x2400",
    },
    {
        "manufacturer": "realme", "device": "RMX3085", "model": "RMX3085",
        "cpu": "MT6893", "android_version": 31, "android_release": "12",
        "dpi": "400dpi", "resolution": "1080x2400",
    },
    {
        "manufacturer": "OnePlus", "device": "CPH2409", "model": "CPH2409",
        "cpu": "qcom", "android_version": 33, "android_release": "13",
        "dpi": "420dpi", "resolution": "1080x2412",
    },
    {
        "manufacturer": "oppo", "device": "CPH2387", "model": "CPH2387",
        "cpu": "MT6769V/CZ", "android_version": 31, "android_release": "12",
        "dpi": "320dpi", "resolution": "720x1600",
    },
    {
        "manufacturer": "vivo", "device": "V2254A", "model": "V2254A",
        "cpu": "MT6893", "android_version": 33, "android_release": "13",
        "dpi": "400dpi", "resolution": "1080x2408",
    },
]

# Instagram app versions to vary across accounts
_APP_VERSIONS = [
    ("269.0.0.18.75", "314665256"),
    ("271.0.0.18.114", "318023777"),
    ("273.0.0.16.70", "320913836"),
    ("275.0.0.27.98", "323477726"),
    ("277.0.0.24.91", "325881765"),
]


def _device_for_session(session_id: str) -> dict:
    """Pick a stable device fingerprint for this account based on its session_id."""
    seed = int(hashlib.sha256(session_id.encode()).hexdigest(), 16)
    rng = random.Random(seed)
    base = rng.choice(_DEVICE_POOL)
    app_version, version_code = rng.choice(_APP_VERSIONS)
    return {**base, "app_version": app_version, "version_code": version_code}


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

    device = _device_for_session(session_id)

    cl = Client()
    cl.set_device(device)
    cl.set_user_agent(
        f"Instagram {device['app_version']} Android ({device['android_version']}/"
        f"{device['android_release']}; {device['dpi']}; {device['resolution']}; "
        f"{device['manufacturer']}; {device['device']}; {device['cpu']}; en_US; "
        f"{device['version_code']})"
    )
    cl.login_by_sessionid(session_id)

    _warmup(cl)

    media = cl.clip_upload(local_path, caption=caption)
    return f"https://www.instagram.com/reel/{media.code}/"
