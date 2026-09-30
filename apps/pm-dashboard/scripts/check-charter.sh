#!/usr/bin/env bash
# Kept as the public entry point for existing project workflows.
set -euo pipefail
exec python3 "$(dirname "$0")/check_charter.py" "$@"
