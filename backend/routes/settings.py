import json
import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import ConnectedAccount, User
from services.auth import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])


class SaveKeysBody(BaseModel):
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None


class ConnectInstagramBody(BaseModel):
    session_id: str
    account_name: str


class ConnectYouTubeBody(BaseModel):
    account_name: str
    client_id: str
    client_secret: str
    refresh_token: str
    access_token: Optional[str] = ""


@router.get("/keys")
def get_keys(current_user: User = Depends(get_current_user)):
    return {
        "gemini_set": bool(os.getenv("GEMINI_API_KEY")),
        "groq_set": bool(os.getenv("GROQ_API_KEY")),
    }


@router.post("/keys")
def save_keys(body: SaveKeysBody, current_user: User = Depends(get_current_user)):
    env_path = ".env"
    try:
        with open(env_path) as f:
            lines = f.readlines()
    except FileNotFoundError:
        lines = []

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
def get_accounts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(ConnectedAccount).filter(ConnectedAccount.user_id == current_user.id).all()


@router.post("/connect/instagram")
def connect_instagram(body: ConnectInstagramBody, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    creds = json.dumps({"session_id": body.session_id})
    account = ConnectedAccount(
        user_id=current_user.id,
        platform="instagram",
        account_name=body.account_name,
        credentials_json=creds,
        is_active=True,
    )
    db.add(account)
    db.commit()
    return {"ok": True}


@router.post("/connect/youtube")
def connect_youtube(body: ConnectYouTubeBody, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    creds = json.dumps({
        "client_id": body.client_id,
        "client_secret": body.client_secret,
        "refresh_token": body.refresh_token,
        "access_token": body.access_token,
    })
    account = ConnectedAccount(
        user_id=current_user.id,
        platform="youtube",
        account_name=body.account_name,
        credentials_json=creds,
        is_active=True,
    )
    db.add(account)
    db.commit()
    return {"ok": True}


@router.delete("/accounts/{account_id}")
def disconnect_account(account_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(ConnectedAccount).filter(
        ConnectedAccount.id == account_id,
        ConnectedAccount.user_id == current_user.id,
    ).first()
    if account:
        db.delete(account)
        db.commit()
    return {"ok": True}
