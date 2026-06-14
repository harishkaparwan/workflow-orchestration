# ============================================================
# Polyglot Monorepo: NestJS API + n8n + Custom Nodes
# ============================================================
FROM node:22-alpine

# Install system dependencies
RUN apk add --no-cache supervisor bash python3 py3-pip gcc g++ make musl-dev python3-dev postgresql-dev

# Create app directory
WORKDIR /app

# Copy package files first (better Docker layer caching)
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./
COPY apps/python-backend/requirements.txt ./apps/python-backend/requirements.txt

# Install dependencies
RUN npm ci --ignore-scripts
# Create virtual environment and install Python dependencies
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir setuptools && pip install --no-cache-dir -r apps/python-backend/requirements.txt

# Copy the rest of the source code
COPY . .

# Build shared library first, then the API and custom nodes
RUN npx nx build shared && npx nx build api && npx nx build n8n-custom-nodes

# Install n8n globally
RUN npm install -g n8n@latest --no-fund --no-audit

# Make n8n worker scripts executable
RUN chmod +x apps/n8n-worker/scripts/*.sh

# Create n8n custom nodes directory and link the built custom nodes package
RUN mkdir -p /data/n8n/.n8n/custom && \
    ln -sfn /app/packages/n8n-custom-nodes /data/n8n/.n8n/custom/automation-hub-nodes

# Copy supervisord config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Set default environment variables for database connections
ENV PGHOST=host.containers.internal \
    PGPORT=5434 \
    PGUSER=localadmin \
    PGPASSWORD=localadmin \
    PGDATABASE=hercules \
    MONGO_URI=mongodb://host.containers.internal:27017 \
    N8N_ENV_VARS_ALLOWED=PGHOST,PGPORT,PGUSER,PGPASSWORD,PGDATABASE,MONGO_URI

# Expose ports:
#   3000 - NestJS API
#   5678 - n8n
#   8000 - Python FastAPI Backend
EXPOSE 3000 5678 8000

# Health check for services
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:3000/api/health && \
      wget --spider -q http://localhost:5678/healthz && \
      wget --spider -q http://localhost:8000/health || exit 1

# Start supervisord (runs both services)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
