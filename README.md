# PostFlow AI

Social media autopilot — discovers viral videos by hashtag and auto-posts them to your accounts.

## Stack

- **Backend:** FastAPI + SQLAlchemy + yt-dlp + APScheduler
- **Frontend:** React + Vite + React Router
- **Database:** PostgreSQL (via Supabase or local)

## Running the Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill in your values
uvicorn main:app --reload
```

API available at: http://localhost:8000  
Docs at: http://localhost:8000/docs

## Running the Frontend

```bash
cd frontend
cp .env.example .env.local      # fill in Supabase keys if needed
npm install
npm run dev
```

App available at: http://localhost:5173

## Project Structure

```
postflow-ai/
  backend/
    main.py             FastAPI entry point
    models.py           SQLAlchemy models
    database.py         DB engine + session
    routes/             API route handlers
    services/
      discovery.py      yt-dlp video discovery
      scheduler.py      APScheduler (every 6h)
  frontend/
    src/
      lib/
        api.js          Axios API helpers
        supabase.js     Supabase client
      components/
        Sidebar.jsx
        Layout.jsx
      pages/
        Dashboard.jsx
        Sources.jsx
        Queue.jsx
        History.jsx
        Settings.jsx
```
