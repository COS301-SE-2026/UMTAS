#!/bin/bash
set -e

echo "Starting Simulation Service Wrapper..."


exec python core/runner.py "$@"