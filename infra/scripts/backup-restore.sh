#!/usr/bin/env bash
# Restore only into a disposable container. With no argument, use test data.
set -euo pipefail
name="umtas-restore-$(date +%s)-$$"
folder=$(mktemp -d)
cleanup() {
  docker rm -f -v "$name" >/dev/null 2>&1 || true
  rm -rf "$folder"
}
trap cleanup EXIT

docker run -d --name "$name" --network none \
  -e POSTGRES_HOST_AUTH_METHOD=trust postgres:15-alpine >/dev/null
for attempt in $(seq 1 30); do
  if docker exec "$name" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec "$name" pg_isready -U postgres >/dev/null

backup=${1:-"$folder/backup.sql"}
if [ $# -eq 0 ]; then
  docker exec "$name" psql -X -v ON_ERROR_STOP=1 -U postgres -c \
    "CREATE TABLE recovery_probe (id integer PRIMARY KEY, value text NOT NULL); INSERT INTO recovery_probe VALUES (1, 'umtas'), (2, 'recovery');" >/dev/null
  docker exec "$name" pg_dump -U postgres postgres > "$backup"
fi
[ -s "$backup" ] || { echo 'A non-empty plain SQL backup is required.' >&2; exit 2; }

docker exec "$name" createdb -U postgres restore_test
started=$(date +%s)
docker exec -i "$name" psql -X -v ON_ERROR_STOP=1 -U postgres -d restore_test < "$backup" >/dev/null
if [ $# -eq 0 ]; then
  rows=$(docker exec "$name" psql -X -U postgres -d restore_test -Atc 'SELECT count(*) FROM recovery_probe')
  [ "$rows" = 2 ] || { echo 'Restored row count differs.' >&2; exit 1; }
  echo 'Synthetic rows recovered: 2'
else
  docker exec "$name" psql -X -v ON_ERROR_STOP=1 -U postgres -d restore_test -c \
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  echo 'Check restored table counts and application invariants against the source backup.'
fi
printf 'Restore passed. Backup bytes: %s. Restore seconds: %s.\n' \
  "$(wc -c < "$backup" | tr -d ' ')" "$(( $(date +%s) - started ))"
