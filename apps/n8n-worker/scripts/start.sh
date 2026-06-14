#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
APP_DIR="$(dirname "$DIR")"
ROOT_DIR="$(dirname "$(dirname "$APP_DIR")")"

# Load environment variables
export $(grep -v '^#' "$APP_DIR/config/default.env" | xargs)

# Map custom PG* environment variables to n8n's expected format
export DB_TYPE=postgresdb
export DB_POSTGRESDB_HOST=${PGHOST:-host.containers.internal}
export DB_POSTGRESDB_PORT=${PGPORT:-5434}
export DB_POSTGRESDB_DATABASE=${PGDATABASE:-hercules}
export DB_POSTGRESDB_USER=${PGUSER:-localadmin}
export DB_POSTGRESDB_PASSWORD=${PGPASSWORD:-localadmin}

# Create n8n data directory if it doesn't exist
mkdir -p "$N8N_USER_FOLDER/.n8n/custom"

# Link custom nodes
ln -sfn "$ROOT_DIR/packages/n8n-custom-nodes" "$N8N_USER_FOLDER/.n8n/custom/automation-hub-nodes"

# Start n8n
n8n start
