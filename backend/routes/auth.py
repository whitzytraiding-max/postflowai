from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import User
from services.auth import hash_password, verify_password, create_token, get_current_user

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
