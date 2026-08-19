#!/bin/bash
set -e

if [ $# -eq 0 ]; then
    echo "NFR Testing Container started. Idling and waiting for tests..."
    exec tail -f /dev/null
fi

echo "Executing test command: $@"
exec "$@"