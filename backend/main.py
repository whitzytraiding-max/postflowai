import os
import subprocess
import atexit
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from routes import sources, queue, discovery, accounts, pipeline, settings, autopilot, admin
from routes.auth import router as auth_router
from services.auth import get_current_user
from services.scheduler import start_scheduler
from models import User

_pot_proc = None


def _start_pot_server():
    global _pot_proc
    server_js = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "bgutil", "server", "build", "main.js")
    )
    if not os.path.exists(server_js):
        print(f"[POT] bgutil server not found at {server_js} — skipping")
        return
    try:
        _pot_proc = subprocess.Popen(["node", server_js])
        atexit.register(lambda: _pot_proc.terminate() if _pot_proc else None)
        os.environ["YT_DLP_GET_POT_POT_SERVER_HOST"] = "localhost"
        os.environ["YT_DLP_GET_POT_POT_SERVER_PORT"] = "4416"
        print(f"[POT] bgutil token server started on port 4416 (PID {_pot_proc.pid})")
    except Exception as e:
        print(f"[POT] Failed to start bgutil server: {e}")


Base.metadata.create_all(bind=engine)

app = FastAPI(title="PostFlow AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(sources.router)
app.include_router(queue.router)
app.include_router(discovery.router)
app.include_router(accounts.router)
app.include_router(pipeline.router)
app.include_router(settings.router)
app.include_router(autopilot.router)
app.include_router(admin.router)


@app.on_event("startup")
def on_startup():
    _run_migrations()
    _start_pot_server()
    start_scheduler()


def _run_migrations():
    from sqlalchemy import text
    migrations = [
        "ALTER TABLE sources ADD COLUMN IF NOT EXISTS auto_approve BOOLEAN DEFAULT FALSE",
        "ALTER TABLE sources ADD COLUMN IF NOT EXISTS instagram_account_id VARCHAR",
        "ALTER TABLE sources ADD COLUMN IF NOT EXISTS youtube_account_id VARCHAR",
        "ALTER TABLE sources ADD COLUMN IF NOT EXISTS language VARCHAR DEFAULT 'any'",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass


@app.get("/")
def root():
    return {"status": "ok", "app": "PostFlow AI"}


@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "healthy"}


@app.get("/post-history")
def get_post_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import PostHistory
    return (
        db.query(PostHistory)
        .filter(PostHistory.user_id == current_user.id)
        .order_by(PostHistory.posted_at.desc())
        .limit(50)
        .all()
    )
