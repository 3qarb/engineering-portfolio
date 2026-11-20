#!/usr/bin/env bash
# Generates the downloadable CVs from the site's own CV page:
#   /cv/print     → public/cv.pdf     (English)
#   /ar/cv/print  → public/cv-ar.pdf  (Arabic)
# Run it again whenever src/data (profile, experience, skills) changes.
# Needs the dev server running (npm run dev) and playwright-cli installed:
#   npm install -g @playwright/cli@latest
# Usage: npm run build:cv [-- base-url]
set -euo pipefail

BASE="${1:-http://localhost:3000}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public"
# Playwright runs in Node: on Windows it needs a C:/… path, not /c/…
if command -v cygpath >/dev/null 2>&1; then OUT="$(cygpath -m "$OUT")"; fi

S=cv
playwright-cli -s=$S open "about:blank" >/dev/null

for pair in "cv/print:cv.pdf" "ar/cv/print:cv-ar.pdf"; do
  path="${pair%%:*}"
  file="${pair##*:}"
  playwright-cli -s=$S goto "$BASE/$path" >/dev/null
  ready=0
  for _ in $(seq 1 60); do
    if playwright-cli -s=$S eval "() => document.body.dataset.cvReady || 'no'" 2>/dev/null | grep -q '"1"'; then ready=1; break; fi
    sleep 0.5
  done
  if [ "$ready" != 1 ]; then echo "CV page at $BASE/$path did not finish loading" >&2; exit 1; fi
  playwright-cli -s=$S run-code "async (page) => { await page.emulateMedia({ media: 'print' }); await page.pdf({ path: '$OUT/$file', format: 'A4', printBackground: true, preferCSSPageSize: true }); }" >/dev/null
  echo "wrote public/$file"
done

playwright-cli -s=$S close >/dev/null
