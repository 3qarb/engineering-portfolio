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
| `npm run check` | type-check, lint, unit tests, production build, sitemap — run before every commit |
| `npm test` | unit tests only (`tests/`) |
| `npm run build` | production build into `dist/` (+ sitemap when `VITE_SITE_URL` is set) |
| `npm run preview` | serve the production build |
| `npm run build:cv` | regenerate `public/cv.pdf` and `public/cv-ar.pdf` from the CV page (dev server running) |
| `npm run capture:renders` | re-render the project images in `public/renders/` from the 3D models |
| `bash scripts/capture-meta.sh` | regenerate `public/og.jpg` (link preview) and `public/apple-touch-icon.png` |

The three capture scripts need `playwright-cli` (`npm install -g @playwright/cli@latest`).

## Environment variables (optional)

Create `.env` (never commit it) or set them in the hosting dashboard:

| Variable | Effect |
|---|---|
| `VITE_SITE_URL` | public address, e.g. `https://your-domain.com` — enables canonical and `hreflang` links, `og:url` and `dist/sitemap.xml` |
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

**Projects added in the site** (`/projects/new`) are stored in the visitor's browser only. To publish
them, press **Export** on the Projects page and save the file as `public/data/projects.json`, then deploy.

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

## Deploy

Any static host works (Netlify, Vercel, Cloudflare Pages). Build command `npm run build`,
output folder `dist`, and an SPA fallback so deep links load `index.html`:

- Netlify: `public/_redirects` with `/*  /index.html  200`
- Vercel: `vercel.json` with `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

Set `VITE_SITE_URL` (and `VITE_CONTACT_ENDPOINT` if used) in the host's environment settings.

## Tests

`tests/` covers the structural maths (bar areas, steel ratios, effective depth, quantities),
schedules and sequencing for every model, rebar cages, English/Arabic key parity and content
guards (the IKK role dates from 2025, no template placeholders, studies marked illustrative).
Browser checks (routes, breakpoints 320–1920, explorer, forms, project add/edit/delete) were run
with playwright-cli and the in-app browser; see `docs/PROJECT_PROGRESS.md`.
