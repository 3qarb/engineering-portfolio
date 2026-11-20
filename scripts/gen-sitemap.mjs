// Writes dist/sitemap.xml and adds its address to dist/robots.txt.
// Needs the public site address: VITE_SITE_URL in the environment, .env.production or .env.
// Without it the step is skipped (a sitemap must use absolute URLs).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

function readEnv(name) {
  if (process.env[name]) return process.env[name];
  for (const file of ['.env.production.local', '.env.production', '.env.local', '.env']) {
    const p = resolve(root, file);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, 'utf8').match(new RegExp(`^\\s*${name}\\s*=\\s*"?([^"\\r\\n]+)"?`, 'm'));
    if (m) return m[1].trim();
  }
  return '';
}

const site = readEnv('VITE_SITE_URL').replace(/\/$/, '');
if (!existsSync(dist)) {
  console.error('gen-sitemap: dist/ not found — run vite build first');
  process.exit(1);
}
if (!site) {
  console.warn('gen-sitemap: VITE_SITE_URL is not set — sitemap.xml skipped');
  process.exit(0);
}

const projects = readFileSync(resolve(root, 'src/data/projects.ts'), 'utf8');
const slugs = [...projects.matchAll(/^\s*slug:\s*'([^']+)'/gm)].map((m) => m[1]);
const pages = ['/', '/projects', '/explorer', '/about', '/cv', '/contact', ...slugs.map((s) => `/projects/${s}`)];
const withLang = (p, lang) => (lang === 'ar' ? `/ar${p === '/' ? '' : p}` : p);
const today = new Date().toISOString().slice(0, 10);

const urls = pages.flatMap((p) =>
  ['en', 'ar'].map(
    (lang) => `  <url>
    <loc>${site}${withLang(p, lang)}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="${site}${withLang(p, 'en')}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${site}${withLang(p, 'ar')}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${site}${withLang(p, 'en')}"/>
  </url>`,
  ),
);

writeFileSync(
  resolve(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`,
);

const robotsPath = resolve(dist, 'robots.txt');
const robots = existsSync(robotsPath) ? readFileSync(robotsPath, 'utf8') : 'User-agent: *\nAllow: /\n';
if (!robots.includes('Sitemap:')) writeFileSync(robotsPath, `${robots.trimEnd()}\n\nSitemap: ${site}/sitemap.xml\n`);

console.log(`gen-sitemap: ${urls.length} URLs → dist/sitemap.xml`);
