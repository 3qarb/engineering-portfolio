// After `vite build`: one HTML file per public page, in English and Arabic, each with its own
// title, description, canonical link, hreflang and Open Graph tags; then sitemap.xml and robots.txt.
//
// Why: link previews (LinkedIn, WhatsApp, X, Slack) and the first pass of search engines read the
// HTML as served and do not run JavaScript. Without this every page would share index.html's tags.
// The React app takes over on load (src/components/Seo.tsx removes these static tags).
//
// Site address: see config/site-url.ts. Without one the pages are still written, with relative
// links, and the sitemap is skipped (it needs absolute URLs).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { siteUrl } from '../config/site-url.ts';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
if (!existsSync(resolve(dist, 'index.html'))) {
  console.error('postbuild: dist/index.html not found, run vite build first');
  process.exit(1);
}

const site = siteUrl(root);
const { en } = await import('../src/i18n/strings.ts');
const { ar } = await import('../src/i18n/strings-ar.ts');
const { toolsEn, toolsAr } = await import('../src/i18n/tools.ts');
const { projects } = await import('../src/data/projects.ts');
const { projectsAr } = await import('../src/i18n/content-ar.ts');

const NAME = 'Abdulaziz Kanaan';
const NAME_AR = 'عبدالعزيز كنعان';
const S = { en, ar };
const T = { en: toolsEn, ar: toolsAr };
const LANGS = ['en', 'ar'];

/** Public, indexable pages. Owner tools (/projects/new, /projects/import, edit) are left out. */
const pages = [
  { path: '/', seo: (l) => S[l].seo.home, type: 'profile' },
  { path: '/projects', seo: (l) => S[l].seo.projects },
  { path: '/explorer', seo: (l) => S[l].seo.explorer },
  { path: '/elements', seo: (l) => T[l].seo.elements },
  { path: '/about', seo: (l) => S[l].seo.about, type: 'profile' },
  { path: '/cv', seo: (l) => S[l].seo.cv, type: 'profile' },
  { path: '/contact', seo: (l) => S[l].seo.contact },
  ...projects.map((p) => ({
    path: `/projects/${p.slug}`,
    type: 'article',
    seo: (l) => {
      const x = l === 'ar' ? { ...p, ...(projectsAr[p.id] ?? {}) } : p;
      const text = x.summary || x.overview || '';
      return { title: `${x.title} — ${l === 'ar' ? NAME_AR : NAME}`, description: text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text };
    },
  })),
];

const withLang = (p, l) => (l === 'ar' ? `/ar${p === '/' ? '' : p}` : p);
const abs = (p) => `${site}${p}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const template = readFileSync(resolve(dist, 'index.html'), 'utf8');

// vercel.json's Content-Security-Policy allows inline scripts only by hash: stop the build if the
// inline script in index.html changed without its hash being updated (the page would go blank)
const csp = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'))
  .headers.flatMap((h) => h.headers)
  .find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
for (const [, code] of template.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
  const hash = `sha256-${createHash('sha256').update(code).digest('base64')}`;
  if (!csp.includes(`'${hash}'`)) {
    console.error(`postbuild: the inline script in index.html is not allowed by vercel.json. Put '${hash}' in script-src.`);
    process.exit(1);
  }
}
// index.html's own static tags are replaced by each page's set
const bare = template.replace(/^[ \t]*<(title|meta|link)\b[^>]*data-static-seo[^>]*>(?:[^<]*<\/title>)?[ \t]*\r?\n/gm, '');
if (bare === template) console.warn('postbuild: no data-static-seo tags found in dist/index.html');

function head(page, l) {
  const { title, description } = page.seo(l);
  if (!title || !description) throw new Error(`postbuild: missing title or description for ${withLang(page.path, l)}`);
  const url = abs(withLang(page.path, l));
  const img = abs('/og.jpg');
  const alt = (k) => esc(abs(withLang(page.path, k)));
  const tags = [
    `<title data-static-seo>${esc(title)}</title>`,
    `<meta data-static-seo name="description" content="${esc(description)}" />`,
    site && `<link data-static-seo rel="canonical" href="${esc(url)}" />`,
    site && `<link data-static-seo rel="alternate" hreflang="en" href="${alt('en')}" />`,
    site && `<link data-static-seo rel="alternate" hreflang="ar" href="${alt('ar')}" />`,
    site && `<link data-static-seo rel="alternate" hreflang="x-default" href="${alt('en')}" />`,
    `<meta data-static-seo property="og:site_name" content="${l === 'ar' ? NAME_AR : NAME}" />`,
    `<meta data-static-seo property="og:type" content="${page.type ?? 'website'}" />`,
    `<meta data-static-seo property="og:title" content="${esc(title)}" />`,
    `<meta data-static-seo property="og:description" content="${esc(description)}" />`,
    `<meta data-static-seo property="og:locale" content="${l === 'ar' ? 'ar_SA' : 'en_GB'}" />`,
    `<meta data-static-seo property="og:locale:alternate" content="${l === 'ar' ? 'en_GB' : 'ar_SA'}" />`,
    site && `<meta data-static-seo property="og:url" content="${esc(url)}" />`,
    `<meta data-static-seo property="og:image" content="${esc(img)}" />`,
    `<meta data-static-seo property="og:image:width" content="1200" />`,
    `<meta data-static-seo property="og:image:height" content="630" />`,
    `<meta data-static-seo property="og:image:alt" content="${esc(title)}" />`,
    `<meta data-static-seo name="twitter:card" content="summary_large_image" />`,
    `<meta data-static-seo name="twitter:title" content="${esc(title)}" />`,
    `<meta data-static-seo name="twitter:description" content="${esc(description)}" />`,
    `<meta data-static-seo name="twitter:image" content="${esc(img)}" />`,
  ].filter(Boolean);
  return tags.map((t) => `    ${t}`).join('\n');
}

let written = 0;
for (const page of pages) {
  for (const l of LANGS) {
    const route = withLang(page.path, l);
    const html = bare
      .replace(/<html\b[^>]*>/, `<html lang="${l}" dir="${l === 'ar' ? 'rtl' : 'ltr'}">`)
      .replace('</head>', `${head(page, l)}\n  </head>`);
    // with cleanUrls, /about is served from about.html and / from index.html
    const out = resolve(dist, route === '/' ? 'index.html' : `${route.slice(1)}.html`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    written++;
  }
}
console.log(`postbuild: ${written} pages with their own title and link preview (${site || 'no site address: relative links'})`);

// robots.txt: owner tools and print views stay out of search; the sitemap address when known
const robots = readFileSync(resolve(root, 'public/robots.txt'), 'utf8').trimEnd();
writeFileSync(resolve(dist, 'robots.txt'), `${robots}\n${site ? `\nSitemap: ${site}/sitemap.xml\n` : ''}`);

if (!site) {
  console.warn('postbuild: no site address (VITE_SITE_URL, or a Vercel build), sitemap.xml skipped');
  process.exit(0);
}
const today = new Date().toISOString().slice(0, 10);
const urls = pages.flatMap((p) =>
  LANGS.map(
    (l) => `  <url>
    <loc>${esc(abs(withLang(p.path, l)))}</loc>
    <lastmod>${today}</lastmod>
${LANGS.map((k) => `    <xhtml:link rel="alternate" hreflang="${k}" href="${esc(abs(withLang(p.path, k)))}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(abs(withLang(p.path, 'en')))}"/>
  </url>`,
  ),
);
writeFileSync(
  resolve(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
);
console.log(`postbuild: sitemap.xml with ${urls.length} URLs`);
