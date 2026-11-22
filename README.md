# Abdulaziz Ahmed Kanaan — Engineering Portfolio

Portfolio of a civil, technical office and structural engineer in Jeddah. English and Arabic,
with an interactive 3D structural explorer (members, reinforcement, cross-sections, quantity
schedules, 4D construction sequence).

Current state, open content questions and next steps: **[docs/PROJECT_PROGRESS.md](docs/PROJECT_PROGRESS.md)**.
Design and implementation standard: **[.claude/skills/engineering-portfolio-design/SKILL.md](.claude/skills/engineering-portfolio-design/SKILL.md)**.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 3 · React Router 7 · Zustand 5 · Motion ·
Three.js 0.187 + React Three Fiber 9 + Drei 10 + postprocessing · Lucide icons ·
oxlint · Vitest 5 · playwright-cli (browser checks, PDF and image generation).

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
npm run dev -- --host  # also reachable from a phone on the same Wi-Fi (http://<your-PC-IP>:3000)
```

| Command | What it does |
|---|---|
| `npm run check` | type-check, lint, unit tests, production build and page heads — run before every commit |
| `npm test` | unit tests only (`tests/`) |
| `npm run build` | production build into `dist/`, then `scripts/postbuild.mjs`: one HTML file per page and language with its own title, description and link preview, `robots.txt`, and `sitemap.xml` when the site address is known |
| `npm run preview` | serve the production build at http://localhost:4173 with the same security headers as Vercel |
| `npm run build:cv -- http://localhost:4173` | regenerate `public/cv.pdf` and `public/cv-ar.pdf` from the CV page (run `npm run build` and `npm run preview` first) |
| `npm run capture:renders` | re-render the project images in `public/renders/` from the 3D models |
| `bash scripts/capture-meta.sh` | regenerate `public/og.jpg` (link preview) and `public/apple-touch-icon.png` |

The three capture scripts need `playwright-cli` (`npm install -g @playwright/cli@latest`).

## Environment variables (optional)

Copy `.env.example` to `.env.local` (git ignores it) or set them in Vercel. Both end up in the public
browser bundle, so never put a secret in a `VITE_` variable.

| Variable | Effect |
|---|---|
| `VITE_SITE_URL` | public address, e.g. `https://your-domain.com`, for canonical and `hreflang` links, link previews and `sitemap.xml`. On Vercel it defaults to the project's production domain, so set it only once a custom domain is attached |
| `VITE_CONTACT_ENDPOINT` | a form service URL that accepts JSON POSTs (e.g. Formspree). Without it the form opens the visitor's email app; if `profile.email` is still a placeholder the form says contact is not configured |

## Content

Everything shown comes from typed data files — edit these, not the components:

| File | Holds |
|---|---|
| `src/data/profile.ts` | name, titles, positioning, contact, about text, `pending` content list |
| `src/data/experience.ts` | roles, newest first (template for adding one is in the file) |
| `src/data/skills.ts` | areas of expertise and software (no levels or percentages) |
| `src/data/projects.ts` | case studies (`kind: 'project'`) and illustrative studies (`kind: 'study'`) |
| `src/data/buildings.ts` | the 3D models; sizes are illustrative unless `basis: 'project'` |
| `src/i18n/strings.ts`, `strings-ar.ts` | interface text, English and Arabic |
| `src/i18n/content-ar.ts` | Arabic versions of the content above |

A value containing `example.` (e.g. the email) is treated as a placeholder and hidden.
After changing profile or experience, run `npm run build:cv` so the PDFs match.

**Owner tools.** Adding, importing and exporting projects are hidden on the public site. Open any page
with `?owner=1` once to show them in that browser (`?owner=0` hides them again); they are always shown
in `npm run dev`. This is not a login: these tools only write to the browser's own storage.

**Projects added in the site** (drop the ETABS/SAFE files at `/projects/import`, or fill the form at
`/projects/new`) are stored in that browser only. To publish one, run `npm run dev`, add it, press
**Publish to the site files** (writes `public/data/projects.json`), then commit and push.

## Adding a real project model (ETABS / SAFE)

A project's own analysis model can drive the 3D explorer and the plans/sections on its case study:

```bash
node scripts/import-etabs.mjs --et "path/model.$et" --report "path/Model Report.pdf" \
  --safe "path/foundation.$sf" --out src/data/models/<id>.json
```

- `--et` (required): ETABS text export (`.$et` or `.e2k`) — joints, members, slabs, story levels.
- `--report` (optional): the ETABS *Model Report* PDF; when given, member sections are taken from it
  (what was issued). Needs the dev dependency `pdfjs-dist` (installed).
- `--safe` (optional): SAFE text file — footings and strap beams.

Then add a small module like `src/data/models/villa.ts` with the reinforcement from the drawings
(column ties, beam and rib bars, covers), and add it to `src/data/buildings.ts` with `basis: 'project'`.

## Languages

English lives at `/…`, Arabic at `/ar/…` (right-to-left, IBM Plex Sans Arabic). The 3D explorer's
engineering tools and the project editor stay in English inside Arabic pages.

## Deploy (GitHub + Vercel)

`vercel.json` holds the whole hosting setup: build command, clean URLs (`/about` serves `about.html`),
redirects for old addresses, the app fallback for page routes (missing files return a real 404), caching,
and the security headers (Content-Security-Policy, HSTS, frame, referrer and permissions policies).

**First deploy**

1. Create an empty **private** repository on GitHub (no README or licence), then push:
   `git remote add origin https://github.com/<you>/<repo>.git` and `git push -u origin main`.
2. In Vercel (free Hobby plan): **Add New → Project → Import** the repository. It reads `vercel.json`,
   so leave the build settings as detected. Deploy.
3. The site is live at `https://<project>.vercel.app`. Every push to `main` redeploys it; other
   branches get preview links.

**Custom domain (later)**

1. Buy the domain from any registrar.
2. Vercel → Project → **Settings → Domains → Add** the domain (and the `www` form). Vercel shows the DNS
   records to create at the registrar (an `A` record for the bare domain, a `CNAME` for `www`).
   HTTPS is issued automatically once DNS resolves.
3. **Settings → Environment Variables**: `VITE_SITE_URL = https://your-domain.com` (Production), then
   **Redeploy** so the links, previews and sitemap use the domain.
4. Optionally add the sitemap (`https://your-domain.com/sitemap.xml`) in Google Search Console.

**Changing the inline script in `index.html`** (the one that sets language and direction before the
first paint): its SHA-256 hash is in the policy in `vercel.json`. `npm run build` stops and prints the
new hash if they no longer match.

## Tests

`tests/` covers the structural maths (bar areas, steel ratios, effective depth, quantities),
schedules and sequencing for every model, rebar cages, English/Arabic key parity and content
guards (the IKK role dates from 2025, no template placeholders, studies marked illustrative).
Browser checks (routes, breakpoints 320–1920, explorer, forms, project add/edit/delete) were run
with playwright-cli and the in-app browser; see `docs/PROJECT_PROGRESS.md`.
