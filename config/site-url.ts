// The public site address, shared by vite.config.ts (canonical and Open Graph links in the app)
// and scripts/postbuild.mjs (static page heads, sitemap).
//   1. VITE_SITE_URL from the environment or a .env file, e.g. https://www.example.com
//   2. On Vercel: the project's production domain, which Vercel sets during every build
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readEnv(root: string, name: string): string {
  if (process.env[name]) return process.env[name] ?? '';
  for (const file of ['.env.production.local', '.env.production', '.env.local', '.env']) {
    const p = resolve(root, file);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, 'utf8').match(new RegExp(`^\\s*${name}\\s*=\\s*"?([^"\\r\\n]+)"?`, 'm'));
    if (m) return m[1].trim();
  }
  return '';
}

/** https://host with no trailing slash, or '' when unknown (a local build without VITE_SITE_URL) */
export function siteUrl(root: string): string {
  const set = readEnv(root, 'VITE_SITE_URL');
  if (set) {
    if (!/^https?:\/\/[^\s/]+/.test(set)) throw new Error(`VITE_SITE_URL must start with https:// (got "${set}")`);
    return set.replace(/\/+$/, '');
  }
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel.replace(/^https?:\/\//, '').replace(/\/+$/, '')}` : '';
}
