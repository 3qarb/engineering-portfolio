---
name: engineering-portfolio-design
description: House rules for Abdulaziz Kanaan's engineering portfolio (React 19 + Vite + Tailwind + React Three Fiber). Use for any change to this repository's pages, components, content data, 3D structural explorer, Arabic/English text, SEO or tests, so new work keeps the same visual identity, content accuracy and performance budget.
---

# Engineering portfolio — design and implementation standard

The site presents a practising civil engineer (technical office and structural engineering, Jeddah)
to engineering companies, consultancies, technical-office managers and recruiters. Every change is
judged by one question: **does this make the engineer look more precise and more credible?**

Read `docs/PROJECT_PROGRESS.md` first: it holds the current state, open content questions and the
exact next steps.

## 1. Content accuracy (non-negotiable)

- Facts come only from `src/data/*` and the owner. Never invent experience, clients, dates,
  quantities, outcomes, certifications, load values or calculations.
- Current role: Technical Office Engineer, IKK Group – Essam Kabbani & Partners, **since 2025**,
  Jeddah Historic District (Al-Balad) restoration, 300+ historic buildings.
- Missing content is a `pending` entry in the data (shown only in `npm run dev` as an amber
  "Content needed" note), never a fake value in production.
- The 3D models use **typical, illustrative** member sizes. Anything drawn from `src/data/buildings.ts`
  says so (`basis: 'illustrative'` → "Illustrative model" tag). Only a spec with `basis: 'project'`
  may be presented as a real design, and only when the owner supplies the drawing values.
- No confidential project documents, client drawings or personal data of others.
- Contact details live in `src/data/profile.ts`; a value containing `example.` is a placeholder and
  the UI must hide it or say the channel is not configured.

## 2. Visual identity

Premium engineering publication: Swiss grid, editorial type, drawing-sheet details.

| Token | Value | Use |
|---|---|---|
| `ink-950` | `#09090a` | page ground (architectural black) |
| `ink-900/850/800` | `#0f0f10 / #141415 / #1a1a1b` | panels, tables, inputs |
| `bone` | `#ece7df` | primary text |
| `bone-dim` | `#b9b3aa` | body copy |
| `bone-mute` | `#958f86` | labels, secondary (6.2:1 on ink) |
| `bone-faint` | `#807a72` | smallest allowed text tone (4.7:1 on ink); never darker |
| `sand` | `#c9a46c` | bronze accent: index numbers, active state, one key line per view |
| `rust` | `#c0603f` | errors and destructive actions only |

- One accent. No gradients except the hero legibility veil; no glassmorphism except the fixed header.
- Radius scale is tight: `rounded-sm` (2 px) for controls, `rounded`–`rounded-3xl` all resolve to
  3–4 px (see `tailwind.config.js`). `rounded-full` only for dots and the view-cube home button.
- Hairline rules (`border-white/[0.08]`) separate content; boxes are the exception.
- Imagery: real project photographs (owner-supplied) first, then the site's own 3D renders
  (`public/renders/*.jpg`, made by `scripts/capture-renders.sh`). No stock illustrations, no skill
  bars or percentages.

## 3. Typography

- Latin: **Inter Tight** (display + body), **JetBrains Mono** (labels, dimensions, data).
- Arabic: **IBM Plex Sans Arabic** for everything; Arabic labels drop uppercase and letter-spacing.
- Classes: `.display` + `.h-xl/.h-lg/.h-md` for headings, `.lede` for intros, `.label` for
  mono micro-labels, body 15–17 px, line length ≤ 68ch.
- Dimensions are written the drawing way: `500×700`, `16T25`, `T10@150`, `C40/50`, mm unless stated.

## 4. Layout and components

- `.wrap` gives the page edges (max 1440, `--gutter`). Section pattern: a 12rem label column
  (`index / label`) and a content column — `SectionHead` in `src/components/ui/Section.tsx`.
- One button pair: `.btn-solid` (primary) and `.btn-ghost` (secondary). Buttons say verb + object.
- Chips (`.chip`) are filters/toggles with `aria-pressed`.
- Max two boxes deep. Tables scroll inside their own container on small screens, never the page.
- Touch targets ≥ 44 px; nothing may overflow at 320 px.

## 5. Motion (Motion for React, `motion/react`)

- Hero enters once on load; page blocks use `FadeUp`/`LineReveal` once. No fade-in on every section,
  no parallax text, no scroll-jacking.
- Durations 0.2–0.6 s for UI, ≤ 1 s for entrances, ease `[0.22, 1, 0.36, 1]`.
- Hover: links draw underlines, linked cards lift ≤ 2 px, images zoom ≤ 1.03.
- `prefers-reduced-motion`: everything rests and stays visible; the 3D camera stops auto-rotating.
- Skills to consult: `animate`, `emil-design-eng`, `find-animation-opportunities` (proposals only).

## 6. React and code conventions

- React 19, TypeScript strict, function components, Zustand for shared state
  (`explorerStore`, `projectsStore`, `uiStore`). Data stays in `src/data/*`, never hard-coded in JSX.
- Route-level code splitting with `lazy()`: explorer, editor, render page and CV are separate chunks;
  `three` lives in its own chunk (`vite.config.ts` manualChunks) and never loads on first paint
  except through the lazy hero canvas.
- i18n: UI strings in `src/i18n/strings.ts` (`ar` must satisfy `typeof en`), content overlays in
  `src/i18n/content-ar.ts`. Read them with `useT()` / `useLang()`; build links with `useLocalePath()`.
  Arabic routes live under `/ar`. Use logical utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`,
  `text-start`) instead of left/right in new code.
- Per-page `<title>`, description, canonical and Open Graph come from `<Seo>` (React 19 hoists them).
- Files under 500 lines. Validate imported JSON (`isUserProject`) at the boundary.
- Skills: `vercel-react-best-practices` (re-renders, bundle), `vercel-composition-patterns`.

## 7. 3D structural explorer (`src/components/three`, `src/lib/structure`)

- Members are generated from `BuildingSpec` (`generate.ts`, `heritage.ts`, `scaffold.ts`) and drawn
  with **instanced meshes per geometry/material group** — never one mesh per member.
- Quality tiers from `src/lib/device.ts`: `high` (dpr ≤ 1.5, 2048 shadows, N8AO + SMAA),
  `balanced` (dpr ≤ 1.25, 1024 shadows, SMAA only), `low` (dpr 1, no shadows, no post).
  Touch devices and small screens start at `balanced`; drei `PerformanceMonitor` steps down on
  sustained low FPS. The canvas stops rendering when off-screen.
- No WebGL → `StaticFallback` (pre-rendered image + the full panel, schedules and section drawings).
- Selection, section drawings, rebar cages, schedules, 4D sequence and exports must stay in sync
  with the same `StructuralElement` data; `sectionMath.ts` is the single source of steel areas and
  ratios (covered by `tests/`).
- Skills: `3dviz-pro-max` (scene craft), `threejs-r3f`, `threejs-performance`, `threejs-debugging`,
  `threejs-assets` (only if glTF assets are introduced).

## 8. Accessibility (WCAG 2.2 AA)

Semantic landmarks, one `h1` per page, headings in order, visible focus (`:focus-visible` sand ring),
skip link, labelled form fields with errors tied by `aria-describedby`, `aria-pressed` toggles,
`aria-expanded` menu button, dialogs trap focus and close on Esc, alt text describes the structure
shown. Skills: `accessibility`, `web-design-guidelines`.

## 9. SEO

Unique title + description per route, canonical (from `VITE_SITE_URL`), Open Graph image
(`public/og.jpg`), `hreflang` pairs for `/` and `/ar`, `public/robots.txt`, `public/sitemap.xml`
(regenerated by `scripts/postbuild.mjs` at build, with one HTML head per page), JSON-LD `Person` on the home page.
Skills: `audit-site-overview`, `audit-indexability`, `suggest-next-seo-actions`.

## 10. Testing and release

- `npm run check` = `tsc -b` + `oxlint` + `vitest run` + `vite build`. Must pass before a commit.
- Unit tests in `tests/` for structural maths, schedules, sequencing, i18n key parity.
- Browser verification with `playwright-cli` (skill `playwright-cli`): routes, explorer selection,
  section modal, project add/edit/delete, CV, contact form, widths 320–1920, both languages.
- Deploy is a separate, owner-approved step (static `dist/`, SPA fallback to `index.html`).

## Skill routing

| Area | Use |
|---|---|
| Design direction | this skill, then `design-taste-frontend`, `ui-ux-pro-max`; brand references in `~/.claude/skill-sources/awesome-design-md` |
| Visual from a reference image | `image-to-code` |
| Motion | `animate`, `emil-design-eng`, `review-animations` |
| React | `vercel-react-best-practices`, `vercel-composition-patterns` |
| Accessibility | `accessibility`, `web-design-guidelines` |
| Performance | `performance`, `threejs-performance` |
| 3D | `3dviz-pro-max`, `threejs-r3f`, `threejs-debugging` |
| SEO | `audit-site-overview`, `audit-indexability`, `suggest-next-seo-actions` |
| Arabic / RTL | `internationalization-i18n` |
| Tests | `vitest-testing`; browser: `playwright-cli` |
| Hosting headers | `security-headers-configuration` |
| Orchestration | Ruflo only for genuinely parallel multi-file work; one writer per worktree |
