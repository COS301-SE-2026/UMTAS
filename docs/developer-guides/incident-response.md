# Incident Response

If deployment and automatic rollback both fail, inspect the production service status and logs on the server checkout. Set `IMAGE_TAG` to the known previous release before running Compose commands.

```bash
export IMAGE_TAG=v1.0.0
phase run --env production -- docker compose -p umtas-prod -f docker-compose.prod.yml ps
phase run --env production -- docker compose -p umtas-prod -f docker-compose.prod.yml logs --tail 100 backend frontend solver-worker pdf-parser-worker
```

Resolve the reported configuration or service failure, then start and verify the previous release.

```bash
phase run --env production -- docker compose -p umtas-prod -f docker-compose.prod.yml up -d --wait --wait-timeout 180
python3 infra/scripts/verify-deployment.py https://capstone-vigil.dns.net.za "$IMAGE_TAG"
```

Image rollback does not restore the database. Check schema compatibility before retrying. Validate any SQL backup in a disposable database with `bash infra/scripts/backup-restore.sh /path/to/backup.sql` before planning a production restore.
