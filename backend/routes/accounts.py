from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import ConnectedAccount, User
from services.auth import get_current_user

router = APIRouter(prefix="/accounts", tags=["accounts"])


class CreateAccountBody(BaseModel):
    platform: str
    account_name: str
    credentials_json: str = "{}"


@router.get("")
def list_accounts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == current_user.id
    ).order_by(ConnectedAccount.created_at.desc()).all()


@router.post("")
def add_account(body: CreateAccountBody, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = ConnectedAccount(
        user_id=current_user.id,
        platform=body.platform,
        account_name=body.account_name,
        credentials_json=body.credentials_json,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}")
def delete_account(account_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(ConnectedAccount).filter(
        ConnectedAccount.id == account_id,
        ConnectedAccount.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
    return {"ok": True}
