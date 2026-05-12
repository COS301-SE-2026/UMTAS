# Watchtower Reference Manual (v1.7.0)

## Section 0: Quick Start

Automatically update all running Docker containers to their latest images.

```bash
# Run Watchtower as a container
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower

# Watchtower will now check for updates every 24 hours (default)
```

Expected output: Watchtower starts, scans containers, and logs update activities.

## Section 1: Key Language Terms & Features

- **Interval** — The time (in seconds) between update checks. | `--interval 3600` | ⚠️ Setting this too low can lead to rate limiting from image registries.
- **Schedule** — A cron-like syntax for precisely timing update checks. | `--schedule "0 0 4 * * *"` | ⚠️ Overrides the `--interval` flag if both are provided.
- **Cleanup** — Automatically removes old images after an update is completed. | `--cleanup` | ⚠️ Highly recommended to prevent disk space exhaustion from dangling images.
- **Restart Policy** — Defines whether containers should be restarted after an update. | (Default: Always) | ⚠️ Use `--include-stopped` to also update and restart containers that are currently off.
- **Labels** — Filter which containers Watchtower should monitor using Docker labels. | `com.centurylinklabs.watchtower.enable=true` | ⚠️ Requires the `--label-enable` flag on the Watchtower container.
- **Lifecycle Hooks** — Scripts that run before or after a container is updated. | `pre-update` / `post-update` | ⚠️ Executed inside the target container; ensure the script exists and is executable.
- **Notifications** — Integration with various services (Slack, Discord, Email) to report updates. | `--notifications slack` | ⚠️ Uses the `shoutrrr` library for flexible notification formatting.
- **Monitor-Only** — Checks for updates and sends notifications but does NOT restart containers. | `--monitor-only` | ⚠️ Useful for production environments where manual approval is required.
- **Rolling Updates** — Updates containers one by one instead of all at once. | `--rolling-restart` | ⚠️ Prevents downtime if you have multiple replicas of the same service.
- **Private Registries** — Supports updating images from authenticated registries (Docker Hub, GCR, etc.). | `-v ~/.docker/config.json:/config.json` | ⚠️ Ensure the credentials file is correctly mounted and readable by Watchtower.

## Section 2: Key Commands & Workflows

- `docker run ... containrrr/watchtower` — Standard deployment. | _Automating updates._
- `--run-once` — Checks for updates, applies them, and then exits. | _Manual maintenance window._
- `--stop-timeout 30s` — Time to wait for a container to stop before killing it. | _Graceful shutdowns._
- `--include-restarting` — Also updates containers that are in a restart loop. | _Recovering broken services._
- `--include-stopped` — Updates containers that are not currently running. | _Dormant service maintenance._
- `--revive-stopped` — Starts containers after updating them, even if they were stopped. | _Full system refresh._
- `--warn-on-head-failure` — Logs a warning if the registry doesn't support HEAD requests. | _Registry compatibility._
- `--no-pull` — Uses only local images (useful for testing lifecycle hooks). | _Local development._

## Section 3: Architecture & Component Relationships

```
Docker Socket (/var/run/docker.sock)
       ↓
[Watchtower Container]
       ↓ (Scan)
Running Containers & Images
       ↓ (HEAD Request)
Image Registry (Docker Hub / GHCR)
       ↓ (Pull & Restart if New)
Updated Container Instances
       ↓ (Shoutrrr)
Notification Services (Slack / Email)
```

**Key Flow:** Watchtower polls the **Docker Socket** to find running containers, checks the **Image Registry** for newer versions of their tags, pulls the **New Image**, restarts the **Container** with the same configuration, and sends a **Notification**.

## Section 4: Documentation Links

- [Official Watchtower Docs](https://containrrr.dev/watchtower/) — _Detailed configuration and arguments._
- [Arguments Reference](https://containrrr.dev/watchtower/arguments/) — _List of all CLI flags and environment variables._
- [Lifecycle Hooks Guide](https://containrrr.dev/watchtower/lifecycle-hooks/) — _How to run scripts during updates._
- [Notification Setup](https://containrrr.dev/watchtower/notifications/) — _Configuring Slack, Discord, and more._
- [GitHub Repository](https://github.com/containrrr/watchtower) — _Source code and release notes._
