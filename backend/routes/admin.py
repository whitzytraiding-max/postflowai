import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import ProxyPool, ConnectedAccount, User
from services.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "").lower()


def require_admin(current_user: User = Depends(get_current_user)):
    if not ADMIN_EMAIL or current_user.email.lower() != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


class BulkAddBody(BaseModel):
    proxy_urls: str  # newline-separated list
    label: Optional[str] = None


@router.get("/proxies")
def list_proxies(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    proxies = db.query(ProxyPool).order_by(ProxyPool.created_at.desc()).all()
    result = []
    for p in proxies:
        account_name = None
        if p.assigned_account_id:
            acc = db.query(ConnectedAccount).filter(ConnectedAccount.id == p.assigned_account_id).first()
            account_name = acc.account_name if acc else "(deleted)"
        result.append({
            "id": p.id,
            "proxy_url": p.proxy_url,
            "label": p.label,
            "assigned_account_id": p.assigned_account_id,
            "assigned_account_name": account_name,
            "is_active": p.is_active,
            "created_at": p.created_at,
        })
    return result


@router.get("/proxies/stats")
def proxy_stats(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    total = db.query(ProxyPool).count()
    banned = db.query(ProxyPool).filter(ProxyPool.is_active == False).count()
    active = db.query(ProxyPool).filter(ProxyPool.is_active == True)
    assigned = active.filter(ProxyPool.assigned_account_id.isnot(None)).count()
    available = active.filter(ProxyPool.assigned_account_id.is_(None)).count()
    return {"total": total, "assigned": assigned, "available": available, "banned": banned}


@router.post("/proxies/bulk")
def bulk_add_proxies(body: BulkAddBody, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    lines = [l.strip() for l in body.proxy_urls.strip().splitlines() if l.strip()]
    added = 0
    skipped = 0
    for url in lines:
        existing = db.query(ProxyPool).filter(ProxyPool.proxy_url == url).first()
        if existing:
            skipped += 1
            continue
        db.add(ProxyPool(proxy_url=url, label=body.label))
        added += 1
    db.commit()
    return {"added": added, "skipped": skipped}


@router.delete("/proxies/{proxy_id}")
def delete_proxy(proxy_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    proxy = db.query(ProxyPool).filter(ProxyPool.id == proxy_id).first()
    if not proxy:
        raise HTTPException(status_code=404, detail="Proxy not found")
    # If assigned, clear the proxy from the account's credentials
    if proxy.assigned_account_id:
        acc = db.query(ConnectedAccount).filter(ConnectedAccount.id == proxy.assigned_account_id).first()
        if acc:
            import json
            creds = json.loads(acc.credentials_json)
            creds["proxy_url"] = ""
            acc.credentials_json = json.dumps(creds)
    db.delete(proxy)
    db.commit()
    return {"ok": True}


@router.post("/proxies/{proxy_id}/release")
def release_proxy(proxy_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    proxy = db.query(ProxyPool).filter(ProxyPool.id == proxy_id).first()
    if not proxy:
        raise HTTPException(status_code=404, detail="Proxy not found")
    if proxy.assigned_account_id:
        acc = db.query(ConnectedAccount).filter(ConnectedAccount.id == proxy.assigned_account_id).first()
        if acc:
            import json
            creds = json.loads(acc.credentials_json)
            creds["proxy_url"] = ""
            acc.credentials_json = json.dumps(creds)
    proxy.assigned_account_id = None
    db.commit()
    return {"ok": True}
