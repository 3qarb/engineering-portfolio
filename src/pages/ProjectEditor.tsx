import { lazy, Suspense, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Save, X } from 'lucide-react';
const ModelPreview = lazy(() => import('../components/three/ModelPreview'));

/** JPEG of the live 3D preview, scaled down so it fits browser storage. */
function snapshot(c: HTMLCanvasElement | null, max = 960): string | undefined {
  if (!c || !c.width) return undefined;
  const k = Math.min(1, max / c.width);
  const out = document.createElement('canvas');
  out.width = Math.round(c.width * k);
  out.height = Math.round(c.height * k);
  out.getContext('2d')!.drawImage(c, 0, 0, out.width, out.height);
  return out.toDataURL('image/jpeg', 0.82);
}
import { makeRcSections } from '../lib/structure/generate';
import type { BuildingSpec, StructuralSystem } from '../lib/structure/types';
import { SYSTEM_LABEL } from '../lib/structure/types';
import { slugify, useAllProjects, useProjectsStore, type UserProject } from '../store/projectsStore';
import type { Figure } from '../data/projects';
import { Seo } from '../components/Seo';

/** "Label: value" lines ↔ technical detail rows */
const toTechnical = (s: string) =>
  lines(s)
    .map((l) => {
      const k = l.indexOf(':');
      return k > 0 ? { label: l.slice(0, k).trim(), value: l.slice(k + 1).trim() } : { label: l, value: '' };
    })
    .filter((r) => r.label && r.value);
const fromTechnical = (rows?: { label: string; value: string }[]) => (rows ?? []).map((r) => `${r.label}: ${r.value}`).join('\n');
const MAX_FIGURES = 4;

interface Model {
  enabled: boolean;
  system: StructuralSystem;
  floors: number;
  storeyHeight: number;
  nx: number;
  spanX: number;
  nz: number;
  spanZ: number;
  colB: number;
  colH: number;
  barN: number;
  barDia: number;
  tieDia: number;
  tieSpacing: number;
  beamB: number;
  beamH: number;
  slabT: number;
  concrete: string;
  steel: string;
}

const DEFAULT_MODEL: Model = {
  enabled: true,
  system: 'rc-frame',
  floors: 4,
  storeyHeight: 3.2,
  nx: 3,
  spanX: 5,
  nz: 2,
  spanZ: 5,
  colB: 400,
  colH: 400,
  barN: 8,
  barDia: 16,
  tieDia: 10,
  tieSpacing: 150,
  beamB: 300,
  beamH: 600,
  slabT: 200,
  concrete: 'C30/37',
  steel: 'B500B',
};

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

function toSpec(m: Model, slug: string, name: string): BuildingSpec {
  const floors = Math.round(clamp(m.floors, 1, 30));
  return {
    id: `b-${slug}`,
    projectSlug: slug,
    name,
    system: m.system,
    floors,
    storeyHeight: clamp(m.storeyHeight, 2, 6),
    baysX: Array(Math.round(clamp(m.nx, 1, 8))).fill(clamp(m.spanX, 1.5, 15)),
    baysZ: Array(Math.round(clamp(m.nz, 1, 8))).fill(clamp(m.spanZ, 1, 15)),
    site: { x: 0, z: 0 },
    rc:
      m.system === 'rc-frame'
        ? makeRcSections({
            colB: clamp(m.colB, 150, 2000),
            colH: clamp(m.colH, 150, 2000),
            barN: Math.max(4, Math.round(clamp(m.barN, 4, 40))),
            barDia: clamp(m.barDia, 8, 40),
            tieDia: clamp(m.tieDia, 6, 16),
            tieSpacing: clamp(m.tieSpacing, 50, 400),
            beamB: clamp(m.beamB, 150, 1500),
            beamH: clamp(m.beamH, 200, 2000),
            slabT: clamp(m.slabT, 100, 600),
            concrete: m.concrete.slice(0, 30) || 'C30/37',
            steel: m.steel.slice(0, 30) || 'B500B',
          })
        : undefined,
  };
}

function fromSpec(s?: BuildingSpec): Model {
  if (!s) return { ...DEFAULT_MODEL, enabled: false };
  const c = s.rc?.column;
  return {
    ...DEFAULT_MODEL,
    enabled: true,
    system: s.system,
    floors: s.floors,
    storeyHeight: s.storeyHeight,
    nx: s.baysX.length,
    spanX: s.baysX[0],
    nz: s.baysZ.length,
    spanZ: s.baysZ[0],
    ...(c && s.rc
      ? {
          colB: c.b,
          colH: c.h,
          barN: c.bars.n,
          barDia: c.bars.dia,
          tieDia: c.ties.dia,
          tieSpacing: c.ties.spacing,
          beamB: s.rc.beam.b,
          beamH: s.rc.beam.h,
          slabT: s.rc.slab.t,
          concrete: c.concrete,
          steel: c.steel,
        }
      : {}),
  };
}

/** Downscale an image to a JPEG data URL so it fits in browser storage. */
function readImage(file: File, max = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function Field({ label, children, span = 1 }: { label: string; children: ReactNode; span?: 1 | 2 }) {
  return (
    <label className={span === 2 ? 'sm:col-span-2' : undefined}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function Group({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-6 border-t border-white/[0.08] py-12 md:grid-cols-[12rem_minmax(0,1fr)]">
      <legend className="sr-only">{title}</legend>
      <p className="label pt-1" aria-hidden="true">
        <span className="text-sand">{index}</span> / {title}
      </p>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function ProjectEditor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const all = useAllProjects();
  const save = useProjectsStore((s) => s.save);
  const existing = useProjectsStore((s) => s.userProjects.find((p) => p.slug === slug));
  const categories = useMemo(() => [...new Set(all.map((p) => p.category))], [all]);

  const [f, setF] = useState({
    title: existing?.title ?? '',
    shortTitle: existing?.shortTitle ?? '',
    category: existing?.category ?? '',
    location: existing?.location ?? '',
    client: existing?.client ?? '',
    period: existing?.period ?? '',
    status: existing?.status ?? 'completed',
    role: existing?.role ?? '',
    summary: existing?.summary ?? '',
    overview: existing?.overview ?? '',
    context: existing?.engineeringContext ?? '',
    scope: existing?.scope?.join('\n') ?? '',
    existing: existing?.existingConditions ?? '',
    method: existing?.methodology ?? '',
    technical: fromTechnical(existing?.technical),
    drawings: existing?.drawings.join('\n') ?? '',
    responsibilities: existing?.responsibilities.join('\n') ?? '',
    challenges: existing?.challenges.join('\n') ?? '',
    solutions: existing?.solutions.join('\n') ?? '',
    software: existing?.software.join(', ') ?? '',
    cover: existing?.cover ?? '',
  });
  const [m, setM] = useState<Model>(existing ? fromSpec(existing.building) : DEFAULT_MODEL);
  const [error, setError] = useState('');
  const [figures, setFigures] = useState<Figure[]>(existing?.gallery ?? []);

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const num = (k: keyof Model) => (e: { target: { value: string } }) => setM((s) => ({ ...s, [k]: Number(e.target.value) }));
  const preview = useMemo(() => toSpec(m, 'preview', 'Preview'), [m]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = f.title.trim();
    if (!title) {
      setError('Give the project a title.');
      return;
    }
    let newSlug = existing?.slug ?? slugify(title);
    if (!existing) {
      const taken = new Set(all.map((p) => p.slug));
      let k = 2;
      const base = newSlug;
      while (taken.has(newSlug)) newSlug = `${base}-${k++}`;
    }
    const short = f.shortTitle.trim() || title;
    const project: UserProject = {
      id: newSlug,
      slug: newSlug,
      title: title.slice(0, 140),
      shortTitle: short.slice(0, 60),
      category: f.category.trim() || 'Structural Engineering',
      location: f.location.trim(),
      client: f.client.trim(),
      period: f.period.trim(),
      status: f.status as UserProject['status'],
      role: f.role.trim(),
      thumbnail: '',
      images: [],
      cover: f.cover || undefined,
      kind: 'project',
      summary: f.summary.trim() || undefined,
      overview: f.overview.trim(),
      engineeringContext: f.context.trim(),
      existingConditions: f.existing.trim() || undefined,
      scope: lines(f.scope),
      technical: toTechnical(f.technical),
      gallery: figures,
      responsibilities: lines(f.responsibilities),
      challenges: lines(f.challenges),
      structuralAssessment: '',
      methodology: f.method.trim(),
      solutions: lines(f.solutions),
      software: f.software.split(',').map((s) => s.trim()).filter(Boolean),
      drawings: lines(f.drawings),
      featured: false,
      userCreated: true,
      building: m.enabled ? toSpec(m, newSlug, short) : undefined,
      // a project added from its analysis model keeps that model when its text is edited
      model: existing?.model,
      render: m.enabled ? snapshot(canvasRef.current) : undefined,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    try {
      save(project);
      navigate(`/projects/${newSlug}`);
    } catch {
      setError('Browser storage is full. Use a smaller cover image or export and remove older projects.');
    }
  };

  if (slug && !existing) {
    return (
      <section className="wrap pb-32 pt-[calc(var(--header-h)+96px)]">
        <h1 className="display h-lg">Not editable</h1>
        <p className="mt-6 max-w-[50ch] text-bone-dim">Only projects added in this browser can be edited here. Built-in projects live in <code className="font-mono">src/data/projects.ts</code>.</p>
        <Link to="/projects" className="btn-ghost mt-10">Back to projects</Link>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} lang="en" dir="ltr" className="wrap pb-32 pt-[calc(var(--header-h)+64px)] sm:pt-[calc(var(--header-h)+96px)]" noValidate>
      <Seo title={`${existing ? 'Edit project' : 'Add a project'} — Abdulaziz Kanaan`} description="Project editor" noindex />
      <Link to="/projects" className="label mb-10 inline-flex min-h-[44px] items-center gap-2 hover:text-bone">
        <ArrowLeft className="h-3.5 w-3.5" /> All projects
      </Link>
      <h1 className="display h-lg">{existing ? 'Edit project' : <>Add a <span className="serif-accent">project</span></>}</h1>
      <p className="mt-6 max-w-[56ch] text-[16px] text-bone-dim">
        Fill in what you have; only the title is required. The 3D structure is generated from the grid and member sizes
        you enter and appears in the explorer.
      </p>

      <Group index="01" title="Basics">
        <Field label="Title *" span={2}>
          <input className="field" value={f.title} onChange={set('title')} required aria-invalid={!!error && !f.title.trim()} />
        </Field>
        <Field label="Short title"><input className="field" value={f.shortTitle} onChange={set('shortTitle')} placeholder="Shown in lists" /></Field>
        <Field label="Category">
          <input className="field" value={f.category} onChange={set('category')} list="cats" />
          <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Location"><input className="field" value={f.location} onChange={set('location')} /></Field>
        <Field label="Client"><input className="field" value={f.client} onChange={set('client')} /></Field>
        <Field label="Period"><input className="field" value={f.period} onChange={set('period')} placeholder="2024 – 2025" /></Field>
        <Field label="Status">
          <select className="field" value={f.status} onChange={set('status')}>
            <option value="completed">Completed</option>
            <option value="in-progress">In progress</option>
            <option value="ongoing">Ongoing</option>
          </select>
        </Field>
        <Field label="Your role" span={2}><input className="field" value={f.role} onChange={set('role')} placeholder="Technical Office Engineer" /></Field>
      </Group>

      <Group index="02" title="Story">
        <Field label="One-line summary (lists and cards)" span={2}><input className="field" value={f.summary} onChange={set('summary')} maxLength={160} /></Field>
        <Field label="Overview" span={2}><textarea className="field min-h-[120px]" value={f.overview} onChange={set('overview')} /></Field>
        <Field label="Scope of work, one per line" span={2}><textarea className="field min-h-[110px]" value={f.scope} onChange={set('scope')} /></Field>
        <Field label="Existing structure / conditions" span={2}><textarea className="field min-h-[100px]" value={f.existing} onChange={set('existing')} /></Field>
        <Field label="Your responsibilities, one per line" span={2}><textarea className="field min-h-[140px]" value={f.responsibilities} onChange={set('responsibilities')} /></Field>
        <Field label="Context" span={2}><textarea className="field min-h-[100px]" value={f.context} onChange={set('context')} /></Field>
        <Field label="Challenges, one per line"><textarea className="field min-h-[120px]" value={f.challenges} onChange={set('challenges')} /></Field>
        <Field label="Structural solutions, one per line"><textarea className="field min-h-[120px]" value={f.solutions} onChange={set('solutions')} /></Field>
        <Field label="Assessment and method" span={2}><textarea className="field min-h-[110px]" value={f.method} onChange={set('method')} /></Field>
        <Field label="Technical details, one per line as Label: value"><textarea className="field min-h-[120px]" value={f.technical} onChange={set('technical')} placeholder={'Storeys: 4\nFoundation: Strip footings'} /></Field>
        <Field label="Drawings and calculations, one per line"><textarea className="field min-h-[120px]" value={f.drawings} onChange={set('drawings')} /></Field>
        <Field label="Software, comma separated" span={2}><input className="field" value={f.software} onChange={set('software')} placeholder="ETABS, SAP2000, AutoCAD" /></Field>
        <div className="sm:col-span-2">
          <span className="field-label">Cover photo</span>
          {f.cover ? (
            <div className="relative w-fit">
              <img src={f.cover} alt="Cover preview" className="h-48 rounded-sm object-cover" />
              <button type="button" onClick={() => setF((s) => ({ ...s, cover: '' }))} className="absolute right-2 top-2 grid h-9 w-9 place-items-center bg-ink-950/80 text-bone" aria-label="Remove the cover photo">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="btn-ghost cursor-pointer">
              <ImagePlus className="h-4 w-4" /> Choose a photo
              <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const url = await readImage(file);
                  setF((s) => ({ ...s, cover: url }));
                } catch {
                  setError('That image could not be read.');
                }
              }} />
            </label>
          )}
        </div>
        <div className="sm:col-span-2">
          <span className="field-label">Figures (photos, drawings) · up to {MAX_FIGURES}</span>
          <div className="flex flex-wrap gap-4">
            {figures.map((fig, k) => (
              <div key={fig.src.slice(-24) + k} className="flex w-44 flex-col gap-2">
                <div className="relative">
                  <img src={fig.src} alt={fig.alt || 'Figure preview'} className="aspect-[4/3] w-full border border-white/10 object-cover" />
                  <button type="button" onClick={() => setFigures((x) => x.filter((_, j) => j !== k))} className="absolute end-1.5 top-1.5 grid h-9 w-9 place-items-center bg-ink-950/85 text-bone" aria-label={`Remove figure ${k + 1}`}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <input className="field py-2 text-[13px]" placeholder="Describe the picture" value={fig.alt} aria-label={`Description of figure ${k + 1}`} onChange={(e) => setFigures((x) => x.map((g, j) => (j === k ? { ...g, alt: e.target.value, caption: e.target.value } : g)))} />
              </div>
            ))}
            {figures.length < MAX_FIGURES && (
              <label className="btn-ghost h-fit cursor-pointer">
                <ImagePlus className="h-4 w-4" /> Add a figure
                <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    const src = await readImage(file, 1280);
                    setFigures((x) => [...x, { src, alt: '' }]);
                  } catch {
                    setError('That image could not be read.');
                  }
                }} />
              </label>
            )}
          </div>
        </div>
      </Group>

      <fieldset className="grid gap-6 border-t border-white/[0.08] py-12 md:grid-cols-[12rem_minmax(0,1fr)]">
        <legend className="sr-only">3D structure</legend>
        <p className="label pt-1" aria-hidden="true"><span className="text-sand">03</span> / 3D structure</p>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="grid content-start gap-5 sm:grid-cols-2">
            <label className="flex min-h-[44px] items-center gap-3 sm:col-span-2">
              <input type="checkbox" checked={m.enabled} onChange={(e) => setM((s) => ({ ...s, enabled: e.target.checked }))} className="h-5 w-5 accent-[#c9a46c]" />
              <span className="text-[15px] text-bone">Show this project in the 3D explorer</span>
            </label>
            {m.enabled && (
              <>
                <Field label="Structural system" span={2}>
                  <select className="field" value={m.system} onChange={(e) => setM((s) => ({ ...s, system: e.target.value as StructuralSystem }))}>
                    {(Object.keys(SYSTEM_LABEL) as StructuralSystem[]).map((k) => <option key={k} value={k}>{SYSTEM_LABEL[k]}</option>)}
                  </select>
                </Field>
                <Field label="Storeys"><input type="number" className="field" min={1} max={30} value={m.floors} onChange={num('floors')} /></Field>
                <Field label="Storey height (m)"><input type="number" step="0.1" className="field" value={m.storeyHeight} onChange={num('storeyHeight')} /></Field>
                <Field label="Bays along X"><input type="number" className="field" min={1} max={8} value={m.nx} onChange={num('nx')} /></Field>
                <Field label="Bay width X (m)"><input type="number" step="0.1" className="field" value={m.spanX} onChange={num('spanX')} /></Field>
                <Field label="Bays along Z"><input type="number" className="field" min={1} max={8} value={m.nz} onChange={num('nz')} /></Field>
                <Field label="Bay width Z (m)"><input type="number" step="0.1" className="field" value={m.spanZ} onChange={num('spanZ')} /></Field>
                {m.system === 'rc-frame' && (
                  <>
                    <Field label="Column b × h (mm)">
                      <span className="flex gap-2"><input type="number" className="field" value={m.colB} onChange={num('colB')} aria-label="Column width" /><input type="number" className="field" value={m.colH} onChange={num('colH')} aria-label="Column depth" /></span>
                    </Field>
                    <Field label="Column bars (no. × Ø)">
                      <span className="flex gap-2"><input type="number" className="field" value={m.barN} onChange={num('barN')} aria-label="Number of bars" /><input type="number" className="field" value={m.barDia} onChange={num('barDia')} aria-label="Bar diameter" /></span>
                    </Field>
                    <Field label="Ties (Ø @ spacing)">
                      <span className="flex gap-2"><input type="number" className="field" value={m.tieDia} onChange={num('tieDia')} aria-label="Tie diameter" /><input type="number" className="field" value={m.tieSpacing} onChange={num('tieSpacing')} aria-label="Tie spacing" /></span>
                    </Field>
                    <Field label="Beam b × h (mm)">
                      <span className="flex gap-2"><input type="number" className="field" value={m.beamB} onChange={num('beamB')} aria-label="Beam width" /><input type="number" className="field" value={m.beamH} onChange={num('beamH')} aria-label="Beam depth" /></span>
                    </Field>
                    <Field label="Slab thickness (mm)"><input type="number" className="field" value={m.slabT} onChange={num('slabT')} /></Field>
                    <Field label="Concrete / steel">
                      <span className="flex gap-2"><input className="field" value={m.concrete} onChange={(e) => setM((s) => ({ ...s, concrete: e.target.value }))} aria-label="Concrete grade" /><input className="field" value={m.steel} onChange={(e) => setM((s) => ({ ...s, steel: e.target.value }))} aria-label="Steel grade" /></span>
                    </Field>
                  </>
                )}
              </>
            )}
          </div>
          {m.enabled && (
            <div className="sticky top-28 aspect-square self-start overflow-hidden rounded-sm border border-white/10 bg-ink-950">
              <Suspense fallback={<span className="label grid h-full place-items-center">Building the preview…</span>}>
                <ModelPreview spec={preview} onCanvas={(c) => (canvasRef.current = c)} />
              </Suspense>
              <span className="label pointer-events-none absolute bottom-4 left-4">Saved as the project image</span>
            </div>
          )}
        </div>
      </fieldset>

      <div className="flex flex-col gap-4 border-t border-white/[0.08] pt-10 sm:flex-row sm:items-center">
        <button type="submit" className="btn-solid"><Save className="h-4 w-4" /> {existing ? 'Save changes' : 'Save project'}</button>
        <Link to="/projects" className="btn-ghost">Cancel</Link>
        {error && <p role="alert" className="font-mono text-[12px] text-rust">{error}</p>}
      </div>
    </form>
  );
}
