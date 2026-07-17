# Quality Requirement Mapping

| **Requirement** | **Architectural response** |
|---|---|
| **NFR-1:** 95% within 2 seconds and 500 concurrent users | Interactive requests remain separate from queued parsing and solving. Core and worker concurrency can be configured independently. |
| **NFR-2:** 200% workload increase with at most 10% performance loss | Stateless Core and worker containers can be replicated, while Redis buffers compute work. Parser and solver workers scale independently. |
| **NFR-3:** AES-256 and administrative MFA | HTTPS terminates at ingress, protected routes use session and role guards, worker calls use bearer tokens, and secrets are runtime configuration. |
| **NFR-4:** 99.9% uptime and recovery within 5 minutes | Health endpoints, bounded retries, persistent jobs, container restart policies, and tagged rollback support recovery. |
| **NFR-5:** deployment within 2 hours and 80% coverage | Shared contracts, common worker infrastructure, adapters, container definitions, and automated workflows reduce change scope. |