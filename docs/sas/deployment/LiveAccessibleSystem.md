# Live, Accessible System

## Overview

Distributing the system across subdomains routed by a single reverse proxy enables clean, decoupled access to our production and staging environments.We are restricted to a single server, hence we are using a single ingress controller for routing any traffic to prod/staging.

!!! success "Demo 2 - Implemented"
    The system is live and reachable via public URLs. Let's Encrypt SSL certificates are automatically provisioned by Traefik.

### Service Access Matrix

| Environment | Service | Subdomain / URL Structure | Target Port (via Traefik) |
| :--- | :--- | :--- | :--- |
| **Production** | Frontend | `https://capstone-vigil.dns.net.za` | 80/443 -> 3001 |
| **Production** | API Backend | `https://capstone-vigil.dns.net.za/api` | 80/443 -> 8000 |
| **Production** | Storage (MinIO) | `https://storage.capstone-vigil.dns.net.za` | 80/443 -> 9001 |
| **Production** | Grafana | `https://grafana.capstone-vigil.dns.net.za` | 80/443 -> 3000 |
| **Production** | Brand Style | `https://brand.capstone-vigil.dns.net.za` | 80/443 -> 6767 |
| **Infrastructure** | Traefik Dashboard | `https://traefik.capstone-vigil.dns.net.za` | 80/443 -> `api@internal` |
| **Staging** | Frontend | `https://staging.capstone-vigil.dns.net.za` | 80/443 -> 3003 |
| **Staging** | API Backend | `https://staging.capstone-vigil.dns.net.za/api` | 80/443 -> 8008 |
| **Staging** | Storage (MinIO) | `https://staging.storage.capstone-vigil.dns.net.za` | 80/443 -> 9001 |


---

### Traefik Dashboard Routes 

<figure markdown="span">
  <img src="../Traefik.png" alt="Traefik Dashboard Routes" width="800">
  <figcaption>Fig 1. Live routing configuration via the Traefik Ingress Controller</figcaption>
</figure>

## Future Plans

!!! failure "Not Implemented - Subject to redesign and review"
    The following extensions are planned for post Demo-2 adjustments to ensure we rectify our single points of failure. Identified points of failure are discussed below

??? failure "Single Host Server"
    
    Currently, our entire infrastructure (API, database, storage, solver) shares one server. A hardware or OS failure results in total system downtime, which is one of the main reasons why multiple ingress controllers would ultimately just shift the point of failure on one server. 
    
    **Plan:** We are planning to move to a two server architecture. 
    **Redundancy:** Depending on client feedback and resources having a multi-server architecture is one of the main points that could give us not just software redundancy but hardware redundancy.

??? failure "Single Ingress Controller"
    
    We rely on one Traefik instance for all routing. A crash or misconfiguration here drops all inbound traffic for both staging and production simultaneously.
    
    **Plan:** For post demo 2 extensions we are planning on deploying a tiered ingress architecture with 4 controllers.  
    **Structure:** 1 Global load balancer that routes to our 3 isolated environments(Staging, Production Blue, Production Green).

??? failure "Deployment Strategy (Tagged Pinning)"
    
    Updating tags and recreating containers causes brief downtime and makes rolling back from a broken release a slow process.
    
    **Plan:** Implement Blue-Green Deployments.  
    **Execution:** Run identical Blue and Green production environments to allow for zero-downtime traffic switching and instantaneous rollbacks.
