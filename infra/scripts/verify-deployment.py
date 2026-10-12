#!/usr/bin/env python3
"""Verify public routing, critical readiness, and the running release. No secrets printed."""
import json
import sys
import time
from urllib.request import urlopen


def verify(base, version, attempts=18):
    for attempt in range(attempts):
        try:
            with urlopen(base.rstrip('/') + '/', timeout=10) as response:
                if response.status != 200:
                    raise ValueError('Frontend unavailable')
            with urlopen(base.rstrip('/') + '/api/health/ready', timeout=10) as response:
                health = json.load(response)
            if any(health['services'].get(k) != 'ok' for k in ('database', 'redis')):
                raise ValueError('Dependencies not ready')
            with urlopen(base.rstrip('/') + '/api/version', timeout=10) as response:
                release = json.load(response)
            if release['version'] != version:
                raise ValueError('Wrong release version')
            print(json.dumps({'verifiedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), **release}))
            return
        except Exception as error:
            print(f'Health attempt {attempt + 1}/{attempts} failed: {type(error).__name__}', file=sys.stderr)
            if attempt + 1 < attempts:
                time.sleep(5)
    raise SystemExit('Deployment verification failed. Check logs and rollback.')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Usage: verify-deployment.py BASE_URL EXPECTED_TAG')
    verify(sys.argv[1], sys.argv[2])
