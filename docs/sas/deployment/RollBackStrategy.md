# Rollback Strategy

Production deploys through `.github/workflows/deploy-prod.yml`, which runs `infra/scripts/deploy-production.sh` with a release tag and the currently deployed tag.

The script verifies the current backend image, pulls both releases, starts the new release and checks its health and version. If verification fails, it restores and verifies the previous images.

Database schemas are not rolled back. This workflow does not create a backup automatically. Take a backup before changes that require one with `just prod-db-backup`. Image rollback requires a compatible database schema and does not guarantee zero data loss.

The script requires an existing backend. For a first deployment, configure the production Phase environment and shared proxy, then run the following on the server checkout with the chosen release tag.

```bash
IMAGE_TAG=v1.0.0 phase run --env production -- docker compose -p umtas-prod -f docker-compose.prod.yml pull
IMAGE_TAG=v1.0.0 phase run --env production -- docker compose -p umtas-prod -f docker-compose.prod.yml up -d --wait --wait-timeout 180
python3 infra/scripts/verify-deployment.py https://capstone-vigil.dns.net.za v1.0.0
```

The older `just deploy-prod` command creates a backup and starts containers, but does not perform the workflow's pull, verification or automatic rollback steps. Use the GitHub Actions workflow for subsequent releases.

If automatic rollback fails, follow the [incident response procedure](../../developer-guides/incident-response.md).
