#!/usr/bin/env bash
# Local dev: build Chrome extension zip only (no tag required).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
"$ROOT/scripts/package-release.sh"
echo ""
echo "Load unpacked extension from: $ROOT/build/chrome_ext"
