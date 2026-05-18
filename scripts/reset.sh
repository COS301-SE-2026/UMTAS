#!/usr/bin/env bash
set -euo pipefail

HARD=${HARD:-false}
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Parse DB_MODE from root .env (default: PGLITE)
DB_MODE=$(grep -E "^DB_MODE=" "$ROOT_DIR/.env" 2>/dev/null | head -1 | cut -d= -f2 | tr -d '"' | tr -d "'" || echo "PGLITE")
DB_MODE="${DB_MODE:-PGLITE}"

echo ""
echo "=== UMTAS Reset (DB_MODE=$DB_MODE, HARD=$HARD) ==="
echo ""

echo "==> Killing processes on dev ports..."
for port in 3000 3001 1025 8025 9000 9001; do
  pids=$(lsof -ti ":$port" 2>/dev/null) || true
  if [ -n "$pids" ]; then
    echo "    Killing port $port (PIDs: $pids)"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
done

echo "==> Stopping docker containers..."
cd "$ROOT_DIR"
if [ "$HARD" = "true" ]; then
  docker compose down -v --remove-orphans
else
  docker compose down --remove-orphans
fi

echo "==> Installing dependencies..."
pnpm install

echo "==> Clearing old migrations..."
rm -rf "$ROOT_DIR/apps/backend/drizzle"

echo "==> Generating fresh migrations..."
(cd "$ROOT_DIR/apps/backend" && pnpm db:generate)

if [ "$DB_MODE" = "DATABASE" ]; then
  echo "==> Starting infrastructure (DATABASE mode)..."
  docker compose up -d postgres redis minio mailhog

  echo "==> Waiting for postgres..."
  DB_USER=$(grep -E "^DB_USER=" "$ROOT_DIR/.env" 2>/dev/null | cut -d= -f2 | tr -d '"' || echo "postgres")
  DB_NAME=$(grep -E "^DB_NAME=" "$ROOT_DIR/.env" 2>/dev/null | cut -d= -f2 | tr -d '"' || echo "umtas_db")
  until docker compose exec -T postgres pg_isready -U "$DB_USER" -d "$DB_NAME" 2>/dev/null; do
    sleep 1
  done

  echo "==> Running migrations..."
  (cd "$ROOT_DIR/apps/backend" && pnpm db:migrate)

  echo ""
  echo "=== Done (DATABASE mode) ==="
  echo "    Run 'pnpm dev' to start the app."
else
  echo "==> Starting infrastructure (PGLITE mode)..."
  docker compose up -d redis minio mailhog

  echo ""
  echo "=== Done (PGLITE mode) ==="
  echo "    Migrations + seed run automatically on app startup."
  echo "    Run 'pnpm dev' to start the app."
fi
