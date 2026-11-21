# Project progress — engineering portfolio

Last updated: 2026-11-21 · branch `feat/villa-project` (previous work merged to `main` at `ca6a655`).

## 1. Current state

A bilingual (EN `/`, AR `/ar`) portfolio built on the existing React 19 / Vite 8 / Tailwind /
R3F stack. Everything that worked before was kept: the 3D explorer (instanced models, rebar
cages, section drawings, schedules + CSV, 4D sequence, section box, visual styles, view cube,
PNG export), the project editor with browser storage, JSON import/export, and `/render/:id`.

`npm run check` passes: TypeScript, oxlint (0 warnings), 29 unit tests, production build.

## 2. Completed

**Content accuracy**
- IKK Group role dated **2025** everywhere (was 2022). A unit test guards it.
- Removed claims that could not be verified (listed in §6) and the `[Previous Company]` placeholder roles.
- The three non-Al-Balad entries are now **illustrative technical studies** (`kind: 'study'`),
  labelled as such on cards, case-study pages, the explorer canvas, its panel and section drawings.
- Missing content is listed in `pending` arrays and shown only in `npm run dev` (amber "Content needed" boxes).

**Design system** — one tight radius scale (2–4 px), square buttons and chips, raised grey contrast
(`bone-mute` 6.2:1, `bone-faint` 4.7:1), new favicon and home-screen icon, IBM Plex Sans Arabic.
Documented in `.claude/skills/engineering-portfolio-design/SKILL.md`.

**Pages**
- Home: hero with the full name, three titles, positioning, *View projects* / *Download CV*,
  facts row → 01 Profile → 02 Selected work → 03 Expertise → 04 Experience → 05 3D explorer → 06 Software → 07 Contact.
  On phones the 3D model sits in a band above the text.
- About: introduction, focus areas, experience, expertise, software, CV links.
- Projects: search (name, type, place, software), type filters kept in the URL, separate
  *Projects* and *Technical studies* groups, add / import / export, explanation of local vs published.
- Case study: summary, meta table, embedded 3D model (lazy), then only the blocks that have content —
  overview, role & responsibilities, scope, existing structure, context, challenges, method,
  solutions, technical details, drawings & calculations, software, figures; previous/next navigation.
- Project editor: new fields (summary, scope, existing structure, method, technical details as
  `Label: value`, drawings, up to 4 figures).
- CV: `/cv` preview with **real PDFs** generated from the page (`public/cv.pdf`, `public/cv-ar.pdf`, A4, one page).
- Contact: validated form (errors under fields, focus to the first error, spam trap) with three honest
  modes — form service (`VITE_CONTACT_ENDPOINT`), email app (`mailto`, labelled as such), or
  *not configured* (disabled, says so). Currently **not configured** because the email is a placeholder.
- 404 in both languages.

**Bilingual** — `/ar` routes, RTL layout, `<html lang dir>` set before first paint (no layout flip),
typed dictionaries (`ar` must match `en`; test enforces parity), Arabic content overlays,
language switch in header and menu. The explorer tools and the editor stay English (LTR island).

**3D explorer**
- Quality tiers (`src/lib/device.ts`): high / balanced / low from the hardware, stepped down by drei
  `PerformanceMonitor`, selectable in the toolbar. Balanced drops ambient occlusion and halves the shadow map; low drops shadows and post-processing.
- Rendering pauses when the canvas is off-screen (IntersectionObserver → `frameloop="never"`).
- No-WebGL fallback: rendered image + working panel, drawings and schedules.
- Portrait screens: camera and fog pulled back so all four structures fit; numbered tags on phones;
  44 px touch targets for tools and view-cube home.

**SEO** — per-page title/description/OG/canonical/hreflang via `<Seo>` (React 19 head hoisting),
static defaults in `index.html` for non-JS link previews, `og.jpg`, JSON-LD `Person`, `robots.txt`,
`sitemap.xml` generated at build when `VITE_SITE_URL` is set, `site.webmanifest`, `_redirects`, `_headers`.

**Tests** — `tests/`: section maths, schedules and sequencing for all models, rebar cages, EN/AR parity, content guards.

**Villa project (2026-11-21)** — first project on the site, built from the owner's own files:
- `scripts/import-etabs.mjs` + `scripts/etabs/readers.mjs`: ETABS `.$et` geometry, Model Report PDF sections,
  SAFE footings → `src/data/models/villa.json` (155 column segments, 218 beams, 67 slab panels, 35 footings, 10 straps).
- `src/lib/structure/imported.ts` converts it; `src/data/models/villa.ts` adds reinforcement from S-203/205/207/211/212.
- Explorer: real level names and elevations, hollow-block (ribbed) slab section type, hidden beams matched to HB1–HB5,
  section modal shows member notes and the right basis.
- Case study: framing plans per level and a movable building section drawn from the model
  (`src/components/drawings/ModelDrawings.tsx`), five drawing sheets as figures, Arabic version.
- Review of the files: **docs/VILLA_REVIEW.md** (model vs drawings, bearing pressure, loads, schedules).
- Tests: `tests/villa.test.ts` pins counts, issued 200 mm sections, levels, orientation.

## 3. Verified in a browser (2026-11-20)

| Check | Result |
|---|---|
| Horizontal overflow, routes `/`, `/projects`, case studies, `/about`, `/contact`, `/cv`, `/explorer`, `/ar…` at 320–1920 | none |
| Tap targets < 40 px outside the 3D canvas | none (footer contact link fixed) |
| One `h1`, heading order, alt text, named controls, labelled fields (12 routes) | pass |
| Skip link first on Tab, visible focus ring | pass |
| Contact: empty submit → 3 linked errors; success and failure paths against a local mock endpoint | pass — confirmation only after a 2xx |
| Project add → detail → search → Arabic page → edit (fields prefilled) → delete | pass, storage cleaned |
| Explorer on 375 px: pick building → column → rebar cage + ghosting → section modal (500×700, 16T25, ρ 2.24 %) | pass |
| CV PDFs EN/AR | one A4 page each, text selectable |
| Production build, headless Chromium (desktop / 4× CPU + throttled network) | FCP 0.59 s / 1.38 s · LCP 0.59 s / 1.38 s · CLS ≈ 0 (Arabic cold load: LCP 2.2 s, CLS 0) |

Not tested: real iOS Safari / Android hardware, screen readers (NVDA/VoiceOver), Lighthouse scores.

## 4. Content needed from the owner

1. **Contact email** (and phone if wanted) → `src/data/profile.ts`, then `npm run build:cv`.
2. **LinkedIn URL** → `profile.links.linkedin`, set `verified: true`.
3. **Education** (degree, university, year) and **professional registration** (e.g. Saudi Council of Engineers).
4. **Languages** spoken.
5. **Previous roles**, if any (template in `src/data/experience.ts`).
6. **Al-Balad**: photographs cleared for publication, one building as a worked example
   (condition → assessment → solution), a non-confidential drawing or calculation sheet,
   whether the client/consultant may be named, confirmation of software used.
7. Confirm the five software entries reflect real use (AutoCAD, ETABS, SAP2000, SAFE, Revit).
8. **Villa** (confirmed client project, shown as "Private client"): city, built or not, permission to publish the
   sheets, and the review items in docs/VILLA_REVIEW.md (which ETABS model is current; allowable bearing).
9. Domain name for `VITE_SITE_URL`, and a form service URL for `VITE_CONTACT_ENDPOINT` (e.g. Formspree).

## 5. Remaining work / known issues

- Explorer panel, toolbar, schedule and the project editor are English-only (shown LTR inside Arabic pages).
- No CSP header yet: the inline language script in `index.html` would need a hash, and Google Fonts must be allowed.
- The site is a client-rendered SPA; Google renders it, but pre-rendering the main routes would help other crawlers.
- `three` chunk is ~460 kB gzip; it loads lazily after the hero text, but it does load on the home page.
- View-cube top face is a thin target at the default angle (as in Revit); side faces and Home are full size.
- Hidden in-app preview panes throttle WebGL, so 3D screenshots there take several seconds — not a site issue.

## 6. Claims removed in this pass (restore any that are true, with dates)

- Client "Ministry of Culture" on the IKK role and Al-Balad.
- Al-Balad: structural assessment of 300+ buildings with NDT, Schmidt hammer, endoscopy, 3D laser
  scanning; nano-lime consolidation, helical crack stitching, epoxy timber repair, discrete steel moment frames,
  monitoring programme, "typological strengthening approach", "standardised shop drawing templates"; Rhino/Grasshopper.
- "Structural Analysis and Design Portfolio" 2020–Present, "Multiple Clients", "15–20 % material reduction",
  "automated drawing generation", ROBOT.
- "Temporary Works" 2021–Present, BS 5975 / TG20 compliance, digital scaffold tagging system, needle beams and raking shores, ScaffCalc, TG20 eGuide.
- "Structural Strengthening" 2020–Present, micro-piles, CFRP, post-tensioning, ASCE 41 pushover, half-cell mapping, PROKON, CSI COL.
- Skill levels (expert/advanced…), ROBOT, PROKON, code lists (ACI 318, SBC 304, AISC 360, EC2/3/5/6), expert witness, Dynamo, API automation.

## 7. Key decisions

- Language in the URL (`/ar`) rather than a toggle in storage: shareable, indexable, testable.
- No new runtime dependencies (i18n is a typed dictionary; SEO uses React 19 head hoisting). Dev-only: Vitest.
- Studies stay in the explorer because they show capability, but are never presented as delivered projects.
- Contact never claims to send unless a service answered 2xx.
- Skills used: engineering-portfolio-design (project), design-taste-frontend, threejs-r3f/performance,
  accessibility, vercel-react-best-practices, internationalization-i18n, vitest-testing, playwright-cli,
  security-headers-configuration. Ruflo orchestration was not used: one writer, one worktree.

## 8. Files

New: `src/i18n/*`, `src/components/Seo.tsx`, `src/components/ui/Section.tsx`, `src/lib/device.ts`,
`src/lib/site.ts`, `src/pages/CvPage.tsx`, `tests/*`, `scripts/build-cv.sh`, `scripts/gen-sitemap.mjs`,
`scripts/capture-meta.sh`, `public/{cv-ar.pdf,og.jpg,apple-touch-icon.png,robots.txt,site.webmanifest,_redirects,_headers}`,
`.claude/skills/engineering-portfolio-design/SKILL.md`, `docs/PROJECT_PROGRESS.md`.
Rewritten: data files, all pages, Header, Footer, MainLayout, Hero, WorkList, README.
Edited: explorer (Explorer, Panel, Toolbar, ViewCube, SectionModal), three (SiteScene, Stage, HeroStructure),
`types.ts`, `index.css`, `tailwind.config.js`, `index.html`, `vite.config.ts`, `package.json`.

## 9. Next steps

1. Fill §4 items in `src/data/*`, run `npm run build:cv`, then `npm run check`.
2. Add Al-Balad photographs as `gallery` figures and, if cleared, a sample drawing.
3. Translate the explorer panel and toolbar strings into `src/i18n`.
4. Choose a host, set `VITE_SITE_URL`, deploy `dist/`, submit `sitemap.xml` in Search Console.
5. Test on a real iPhone and Android phone (3D quality tier, touch orbit, RTL).
