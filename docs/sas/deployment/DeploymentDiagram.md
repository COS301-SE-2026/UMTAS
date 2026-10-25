# Deployment Diagram

The diagrams are historical illustrations. The text below describes the current Compose and workflow configuration.
Using [UML Deployment Diagram Specs](https://www.uml-diagrams.org/deployment-diagrams.html) as the specifications for the below diagrams.

## Development Deployment Diagram

Runs on a single developer workstation as a hybrid topology. The backend (:3000) and frontend (:3001) execute as native Node.js processes, while PostgreSQL, Redis, MinIO, MailHog and both BullMQ workers run as containers with six ports published to the host. Images are built locally, no reverse proxy, no TLS.

<figure markdown="span">
  <img src="../dev.svg" alt="Development Deployment Diagram" width="800">
</figure>

## Staging Deployment Diagram

Deployed on the shared Ubuntu VM as Compose project umtas-staging, behind the single Traefik proxy at staging.capstone-vigil.dns.net.za. Pushes to dev deploy images tagged with the seven-character commit SHA. Backend and frontend ports use BACKEND_PORT and FRONTEND_PORT. PostgreSQL, Redis and object storage use separate staging data volumes and an internal network.

<figure markdown="span">
  <img src="../staging.svg" alt="Development Deployment Diagram" width="800">
</figure>

## Production Deployment Diagram

Deployed on the same Ubuntu VM as Compose project umtas-prod, behind the single Traefik proxy at capstone-vigil.dns.net.za. Application images use an explicit release tag and deploy through the manual production workflow. Backend and frontend ports use BACKEND_PORT and FRONTEND_PORT. Production also runs Grafana and separate database, Redis and object storage volumes.

<figure markdown="span">
  <img src="../prod.svg" alt="Development Deployment Diagram" width="800">
</figure>