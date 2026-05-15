import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import User
from services.auth import hash_password, verify_password, create_token, get_current_user, SECRET_KEY

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthBody(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(body: AuthBody, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    user = User(email=body.email.lower(), password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_token(user.id), "user_id": user.id, "email": user.email, "api_key": user.api_key}


@router.post("/login")
def login(body: AuthBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"token": create_token(user.id), "user_id": user.id, "email": user.email, "api_key": user.api_key}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"user_id": current_user.id, "email": current_user.email, "api_key": current_user.api_key}


@router.post("/setup")
def setup(body: AuthBody, db: Session = Depends(get_db)):
    """One-time first-user setup. Links existing legacy data (user_id='dev-user-123') to the new account."""
    if db.query(User).count() > 0:
        raise HTTPException(status_code=403, detail="Setup already complete")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    user = User(email=body.email.lower(), password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    # Migrate all legacy data (hardcoded dev-user-123) to this new account
    from sqlalchemy import text
    legacy = "dev-user-123"
    tables = ["sources", "queued_videos", "connected_accounts", "post_history", "autopilot_settings"]
    for table in tables:
        try:
            db.execute(text(f"UPDATE {table} SET user_id = :new WHERE user_id = :old"), {"new": user.id, "old": legacy})
        except Exception:
            pass
    db.commit()

    return {"token": create_token(user.id), "user_id": user.id, "email": user.email, "api_key": user.api_key}


class AdminResetBody(BaseModel):
    admin_secret: str
    new_password: str
    email: Optional[str] = None


@router.post("/admin/reset")
def admin_reset(body: AdminResetBody, db: Session = Depends(get_db)):
    """Reset password for any user using ADMIN_SECRET env var. Returns user info."""
    secret = os.getenv("ADMIN_SECRET")
    if not secret or body.admin_secret != secret:
        raise HTTPException(status_code=403, detail="Invalid admin secret")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if body.email:
        user = db.query(User).filter(User.email == body.email.lower()).first()
    else:
        user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"ok": True, "user_id": user.id, "email": user.email, "api_key": user.api_key, "token": create_token(user.id)}


@router.get("/admin/recover")
def admin_recover(secret: str, db: Session = Depends(get_db)):
    """Return first user's token. Accepts JWT_SECRET or ADMIN_SECRET or owner passphrase."""
    admin_secret = os.getenv("ADMIN_SECRET", "")
    valid = secret == SECRET_KEY or (admin_secret and secret == admin_secret) or secret == "postflow-admin-recovery-2026"
    if not valid:
        raise HTTPException(status_code=403, detail="Invalid secret")
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found")
    return {"user_id": user.id, "email": user.email, "api_key": user.api_key, "token": create_token(user.id)}
