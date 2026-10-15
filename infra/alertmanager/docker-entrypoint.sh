#!/bin/sh
set -eu
umask 077
cp /etc/alertmanager/alertmanager.yml /tmp/alertmanager.yml
if [ -n "${ALERT_DISCORD_WEBHOOK_URL:-}" ]; then
  printf '%s' "$ALERT_DISCORD_WEBHOOK_URL" > /tmp/discord-webhook
  cat >> /tmp/alertmanager.yml <<'CONFIG'
    discord_configs:
      - webhook_url_file: /tmp/discord-webhook
        send_resolved: true
CONFIG
else
  echo 'Alert notifications disabled: set ALERT_DISCORD_WEBHOOK_URL in Phase production.' >&2
fi
exec /bin/alertmanager --config.file=/tmp/alertmanager.yml --storage.path=/alertmanager
