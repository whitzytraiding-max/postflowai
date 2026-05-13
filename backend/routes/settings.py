from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json
from database import get_db
from models import ConnectedAccount

router = APIRouter(prefix="/settings", tags=["settings"])


class SaveKeysBody(BaseModel):
    user_id: str
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None


class ConnectInstagramBody(BaseModel):
    user_id: str
    session_id: str
    account_name: str


class ConnectYouTubeBody(BaseModel):
    user_id: str
    account_name: str
    client_id: str
    client_secret: str
    refresh_token: str
    access_token: Optional[str] = ""


@router.get("/keys")
def get_keys(user_id: str):
    """Return masked API keys (just shows if set or not)."""
    import os
    from dotenv import load_dotenv
    load_dotenv()
    return {
        "gemini_set": bool(os.getenv("GEMINI_API_KEY")),
        "groq_set": bool(os.getenv("GROQ_API_KEY")),
    }


@router.post("/keys")
def save_keys(body: SaveKeysBody):
    """Write API keys to the .env file."""
    env_path = ".env"
    lines = []
    try:
        with open(env_path) as f:
            lines = f.readlines()
    except FileNotFoundError:
        pass

    def set_key(lines, key, value):
        if not value:
            return lines
        updated = False
        new_lines = []
        for line in lines:
            if line.startswith(f"{key}="):
                new_lines.append(f"{key}={value}\n")
                updated = True
            else:
                new_lines.append(line)
        if not updated:
            new_lines.append(f"{key}={value}\n")
        return new_lines

    if body.gemini_api_key:
        lines = set_key(lines, "GEMINI_API_KEY", body.gemini_api_key)
    if body.groq_api_key:
        lines = set_key(lines, "GROQ_API_KEY", body.groq_api_key)

    with open(env_path, "w") as f:
        f.writelines(lines)

    return {"ok": True}


@router.get("/accounts")
def get_accounts(user_id: str, db: Session = Depends(get_db)):
    return db.query(ConnectedAccount).filter(ConnectedAccount.user_id == user_id).all()


@router.post("/connect/instagram")
def connect_instagram(body: ConnectInstagramBody, db: Session = Depends(get_db)):
    existing = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == body.user_id,
        ConnectedAccount.platform == "instagram",
    ).first()
    creds = json.dumps({"session_id": body.session_id})
    if existing:
        existing.credentials_json = creds
        existing.account_name = body.account_name
        existing.is_active = True
    else:
        account = ConnectedAccount(
            user_id=body.user_id,
            platform="instagram",
            account_name=body.account_name,
            credentials_json=creds,
            is_active=True,
        )
        db.add(account)
    db.commit()
    return {"ok": True}


@router.post("/connect/youtube")
def connect_youtube(body: ConnectYouTubeBody, db: Session = Depends(get_db)):
    existing = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == body.user_id,
        ConnectedAccount.platform == "youtube",
    ).first()
    creds = json.dumps({
        "client_id": body.client_id,
        "client_secret": body.client_secret,
        "refresh_token": body.refresh_token,
        "access_token": body.access_token,
    })
    if existing:
        existing.credentials_json = creds
        existing.account_name = body.account_name
        existing.is_active = True
    else:
        account = ConnectedAccount(
            user_id=body.user_id,
            platform="youtube",
            account_name=body.account_name,
            credentials_json=creds,
            is_active=True,
        )
        db.add(account)
    db.commit()
    return {"ok": True}


@router.delete("/accounts/{account_id}")
def disconnect_account(account_id: str, db: Session = Depends(get_db)):
    account = db.query(ConnectedAccount).filter(ConnectedAccount.id == account_id).first()
    if account:
        db.delete(account)
        db.commit()
    return {"ok": True}
