#!/usr/bin/env bash
# Captures the link-preview image (public/og.jpg, 1200×630, from the home hero)
# and the home-screen icon (public/apple-touch-icon.png, 180×180, from favicon.svg).
# Needs the dev server running (npm run dev) and playwright-cli installed.
# Usage: bash scripts/capture-meta.sh [base-url]
set -euo pipefail

BASE="${1:-http://localhost:3000}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public"
if command -v cygpath >/dev/null 2>&1; then OUT="$(cygpath -m "$OUT")"; fi

S=meta
playwright-cli -s=$S open "about:blank" >/dev/null
playwright-cli -s=$S run-code "async (page) => {
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('$BASE/');
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.waitForTimeout(9000);
  await page.screenshot({ path: '$OUT/og.jpg', type: 'jpeg', quality: 85 });
}" >/dev/null
echo "wrote public/og.jpg"

playwright-cli -s=$S run-code "async (page) => {
  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent('<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\" width=\"180\" height=\"180\" style=\"display:block\"><rect width=\"32\" height=\"32\" fill=\"#09090a\"/><path d=\"M8 24V9h16v15M8 14h16M16 9v15\" fill=\"none\" stroke=\"#ece7df\" stroke-width=\"1.8\"/><circle cx=\"16\" cy=\"14\" r=\"2.2\" fill=\"#c9a46c\"/></svg>', { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: 'html,body{margin:0;background:#09090a}' });
  await page.screenshot({ path: '$OUT/apple-touch-icon.png' });
}" >/dev/null
echo "wrote public/apple-touch-icon.png"

playwright-cli -s=$S close >/dev/null
