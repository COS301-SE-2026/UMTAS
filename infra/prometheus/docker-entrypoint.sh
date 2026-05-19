#!/bin/sh
set -e
if [ -n "$WATCHTOWER_HTTP_API_TOKEN" ]; then
    printf '%s' "$WATCHTOWER_HTTP_API_TOKEN" > /tmp/watchtower_token
fi
exec /bin/prometheus "$@"
