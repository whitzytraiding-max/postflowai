FROM python:3.11-slim

# Install Node.js 20 + canvas runtime libs
RUN apt-get update && apt-get install -y curl \
    libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
    libjpeg62-turbo libgif7 librsvg2-2 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# bgutil PO token server — pre-built JS committed to repo, just install runtime deps
COPY backend/bgutil_server /app/bgutil/server
RUN cd /app/bgutil/server && npm ci --omit=dev --no-audit --no-fund \
    && echo "[POT] bgutil node_modules installed OK"

# Copy backend source
COPY backend/ .

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
