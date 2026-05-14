FROM python:3.11-slim

# Install Node.js 20 + git + curl
RUN apt-get update && apt-get install -y curl git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps — COPY from backend/ since build context is repo root
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Build the bgutil PO token server — optional, service starts even if this fails
RUN (git clone --depth=1 https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git bgutil \
    && cd bgutil/server \
    && npm install \
    && (npm run build 2>&1 || npx tsc 2>&1) \
    && echo "[POT] bgutil server built OK" \
    && find /app/bgutil/server -maxdepth 4 -name "server.js" 2>/dev/null) \
    || echo "[POT] bgutil build failed — service will run without PO tokens"

# Copy backend source
COPY backend/ .

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
