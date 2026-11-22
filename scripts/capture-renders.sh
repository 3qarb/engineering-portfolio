#!/usr/bin/env bash
# Re-captures the project images in public/renders from the live 3D models.
# Needs the dev server running (npm run dev) and playwright-cli installed:
#   npm install -g @playwright/cli@latest
# Usage: bash scripts/capture-renders.sh [base-url]
set -euo pipefail

BASE="${1:-http://localhost:3000}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/renders"
IDS=(${IDS_OVERRIDE:-villa})
mkdir -p "$OUT"

playwright-cli -s=renders open "about:blank" >/dev/null
playwright-cli -s=renders resize 1600 1200 >/dev/null

for id in "${IDS[@]}"; do
  playwright-cli -s=renders goto "$BASE/render/$id" >/dev/null
  for _ in $(seq 1 60); do
    if playwright-cli -s=renders eval "() => document.body.dataset.renderReady || 'no'" 2>/dev/null | grep -q '^"1"'; then break; fi
    sleep 1
  done
  playwright-cli -s=renders screenshot --filename="$OUT/$id.jpg" >/dev/null
  echo "saved $OUT/$id.jpg"
done

playwright-cli -s=renders close >/dev/null
