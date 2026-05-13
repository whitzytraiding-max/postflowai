from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from routes import sources, queue, discovery, accounts, pipeline, settings, autopilot
from services.scheduler import start_scheduler

# Create all DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PostFlow AI", version="1.0.0")

# CORS — allow all origins for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sources.router)
app.include_router(queue.router)
app.include_router(discovery.router)
app.include_router(accounts.router)
app.include_router(pipeline.router)
app.include_router(settings.router)
app.include_router(autopilot.router)


@app.on_event("startup")
def on_startup():
    _run_migrations()
    start_scheduler()


def _run_migrations():
    from sqlalchemy import text
    migrations = [
        "ALTER TABLE sources ADD COLUMN IF NOT EXISTS auto_approve BOOLEAN DEFAULT FALSE",
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


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/post-history")
def get_post_history(user_id: str, db: Session = Depends(get_db)):
    from models import PostHistory
    return (
        db.query(PostHistory)
        .filter(PostHistory.user_id == user_id)
        .order_by(PostHistory.posted_at.desc())
        .limit(50)
        .all()
    )
