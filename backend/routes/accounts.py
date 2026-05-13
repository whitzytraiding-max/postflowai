from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import ConnectedAccount

router = APIRouter(prefix="/accounts", tags=["accounts"])


class CreateAccountBody(BaseModel):
    user_id: str
    platform: str
    account_name: str
    credentials_json: str = "{}"


@router.get("")
def list_accounts(user_id: str, db: Session = Depends(get_db)):
    accounts = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == user_id
    ).order_by(ConnectedAccount.created_at.desc()).all()
    return accounts


@router.post("")
def add_account(body: CreateAccountBody, db: Session = Depends(get_db)):
    account = ConnectedAccount(
        user_id=body.user_id,
        platform=body.platform,
        account_name=body.account_name,
        credentials_json=body.credentials_json,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}")
def delete_account(account_id: str, db: Session = Depends(get_db)):
    account = db.query(ConnectedAccount).filter(ConnectedAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
    return {"ok": True}
