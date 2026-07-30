# Deployment Diagram


## Development Deployment Diagram

Runs on a single developer workstation as a hybrid topology. The backend (:3000) and frontend (:3001) execute as native Node.js processes, while PostgreSQL, Redis, MinIO, MailHog and both BullMQ workers run as containers with six ports published to the host. Images are built locally, no reverse proxy, no TLS.

<figure markdown="span">
  <img src="../dev.svg" alt="Development Deployment Diagram" width="800">
</figure>

## Staging Deployment Diagram

Deployed on the shared Ubuntu VM as Compose project umtas-staging, behind the single Traefik proxy at staging.capstone-vigil.dns.net.za. Images track the floating *-staging-latest tag, rebuilt and redeployed automatically on every merge to main. Backend :8003, frontend :3003, with its own PostgreSQL, Redis and MinIO on an isolated internal network.

<figure markdown="span">
  <img src="../staging.svg" alt="Development Deployment Diagram" width="800">
</figure>

## Production Deployment Diagram

Deployed on the same Ubuntu VM as Compose project umtas-prod, behind the single Traefik proxy at capstone-vigil.dns.net.za. Every image is pinned to an immutable release tag and deployed manually. Backend :8000, frontend :3000, plus Grafana, and its own PostgreSQL, Redis and MinIO on an isolated internal network.

<figure markdown="span">
  <img src="../prod.svg" alt="Development Deployment Diagram" width="800">
</figure>