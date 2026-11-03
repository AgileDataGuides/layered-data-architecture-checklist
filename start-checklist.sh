#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/app"

echo "=== Layered Data Architecture Checklist ==="
echo "Installing dependencies..."
npm install --silent 2>/dev/null || npm install

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Layered Data Architecture Checklist — local-only"
echo "  Listening on http://127.0.0.1:5120"
echo "  Do NOT expose this port to a LAN or the internet."
echo "════════════════════════════════════════════════════════════"
echo ""

npm run dev -- --port 5120 --host 127.0.0.1
