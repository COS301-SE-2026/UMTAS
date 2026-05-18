#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "=== UMTAS Bootstrap ==="
echo ""

copy_env() {
  local src="$1"
  local dest="$2"
  local label="$3"
  if [ ! -f "$dest" ]; then
    cp "$src" "$dest"
    echo "    Created $label"
  else
    echo "    $label already exists (skipped)"
  fi
}

echo "==> Copying env files..."
copy_env "$ROOT_DIR/.env.example"                          "$ROOT_DIR/.env"                          ".env"
copy_env "$ROOT_DIR/apps/backend/.env.example"             "$ROOT_DIR/apps/backend/.env.local"       "apps/backend/.env.local"
copy_env "$ROOT_DIR/apps/frontend/.env.example"            "$ROOT_DIR/apps/frontend/.env.local"      "apps/frontend/.env.local"

echo "==> Installing dependencies..."
(cd "$ROOT_DIR" && pnpm install)

echo ""
echo "=== Bootstrap complete ==="
echo "    Next: edit .env files as needed, then run 'pnpm reset' to initialize."
