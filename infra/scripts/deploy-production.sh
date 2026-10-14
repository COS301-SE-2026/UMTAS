#!/usr/bin/env bash
# Run on the server checkout under Phase's production environment.
set -euo pipefail
release=${1:?Usage: deploy-production.sh RELEASE_TAG PREVIOUS_TAG}
previous=${2:?Provide the known currently deployed release for rollback}
for tag in "$release" "$previous"; do
  [[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+([.-][a-zA-Z0-9.-]+)?$ ]] || { echo 'Use versioned vX.Y.Z release tags.' >&2; exit 2; }
done
export IMAGE_TAG="$release"
compose=(docker compose -p umtas-prod -f docker-compose.prod.yml)
# Check the previous release before changing anything.
backend_id=$("${compose[@]}" ps -q backend)
[[ -n "$backend_id" ]] || { echo 'No running backend: use the documented first-deployment procedure.' >&2; exit 2; }
running_image=$(docker inspect --format '{{.Config.Image}}' "$backend_id")
[[ "$running_image" == "${DOCKER_REGISTRY:-vigilcs/umtas}:backend-$previous" ]] || { echo 'Previous tag does not match the running backend image.' >&2; exit 2; }
# Pull both releases so rollback does not depend on a later download.
IMAGE_TAG="$previous" "${compose[@]}" pull backend frontend solver-worker pdf-parser-worker
"${compose[@]}" pull backend frontend solver-worker pdf-parser-worker
base="https://${PROD_APP_DOMAIN:?PROD_APP_DOMAIN is required}"
verify() {
  python3 infra/scripts/verify-deployment.py "$base" "$1"
}
if "${compose[@]}" up -d --wait --wait-timeout 180 && verify "$release"; then
  echo "Verified production release: $release"
else
  echo "Deployment failed. Restoring $previous (database schema is not rolled back)." >&2
  if IMAGE_TAG="$previous" "${compose[@]}" up -d --wait --wait-timeout 180 && verify "$previous"; then
    echo "Rollback verified: $previous" >&2
  else
    echo "ROLLBACK FAILED. Follow docs/developer-guides/incident-response.md." >&2
  fi
  exit 1
fi
