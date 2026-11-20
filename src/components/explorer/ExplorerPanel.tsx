import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowUpRight, Layers, ScanLine } from 'lucide-react';
import { buildingBounds, elementsFor, levelName } from '../../lib/structure/generate';
import { quantities, sectionFacts, fmt } from '../../lib/structure/sectionMath';
import { KIND_LABEL, SYSTEM_LABEL, type BuildingSpec, type ElementKind, type StructuralElement } from '../../lib/structure/types';
import type { AnyProject } from '../../store/projectsStore';
import { useExplorer } from '../../store/explorerStore';
import { SectionDrawing } from './SectionDrawing';
import { Schedule } from './Schedule';
import { cageFor } from '../../lib/structure/rebar';

const ease = [0.22, 1, 0.36, 1] as const;
const enter = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.07] py-2.5">
      <dt className="label">{label}</dt>
      <dd className="text-right font-mono text-[13px] text-bone">{value}</dd>
    </div>
  );
}

function sectionTitle(el: StructuralElement) {
  const s = el.section;
  switch (s.kind) {
    case 'rc-column':
      return `${s.b}×${s.h} · ${s.bars.n}T${s.bars.dia}`;
    case 'rc-beam':
      return `${s.b}×${s.h} · ${s.bottom.n}T${s.bottom.dia} B`;
    case 'rc-slab':
      return `${s.t} thick · T${s.bottom.dia}@${s.bottom.spacing}`;
    case 'rc-footing':
      return `${s.l}×${s.b}×${s.t}`;
    case 'masonry-wall':
      return `${s.t} coral stone`;
    case 'timber-beam':
      return `${s.b}×${s.h} timber`;
    case 'layered':
      return `${s.layers.reduce((a, l) => a + l.t, 0)} mm build-up`;
    case 'steel-tube':
      return `Ø${s.od}×${s.t} tube`;
  }
}

/* ── State A: the whole site ───────────────────────────────── */

function SiteList({ buildings, projects }: { buildings: BuildingSpec[]; projects: AnyProject[] }) {
  const selectBuilding = useExplorer((s) => s.selectBuilding);
  const hoverBuilding = useExplorer((s) => s.hoverBuilding);
  return (
    <motion.div key="site" {...enter} className="flex flex-col gap-8">
      <div>
        <p className="label mb-4">Site plan · {buildings.length} structures</p>
        <h2 className="display text-[clamp(34px,3.3vw,52px)] [overflow-wrap:anywhere]">Pick a building</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-bone-dim">
          Every block is a structure from my work. Open one to see my role in it, then take it apart storey by storey and
          read any member's size and reinforcement.
        </p>
      </div>
      <ol className="flex flex-col">
        {buildings.map((b, i) => {
          const p = projects.find((x) => x.slug === b.projectSlug);
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => selectBuilding(b.id)}
                onMouseEnter={() => hoverBuilding(b.id)}
                onMouseLeave={() => hoverBuilding(null)}
                className="group flex w-full items-start gap-4 border-t border-white/[0.08] py-4 text-left transition-colors hover:border-sand"
              >
                <span className="font-mono text-[12px] text-sand">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1">
                  <span className="block text-[17px] font-medium text-bone transition-colors group-hover:text-sand">{b.name}</span>
                  <span className="mt-1 block text-[13px] text-bone-mute">{p?.shortTitle ?? SYSTEM_LABEL[b.system]}</span>
                </span>
                <ArrowUpRight className="mt-1 h-4 w-4 text-bone-mute transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-sand" />
              </button>
            </li>
          );
        })}
      </ol>
    </motion.div>
  );
}

/* ── State B: a building ───────────────────────────────────── */

function BuildingDetail({ spec, project, locked }: { spec: BuildingSpec; project?: AnyProject; locked: boolean }) {
  const selectBuilding = useExplorer((s) => s.selectBuilding);
  const selectElement = useExplorer((s) => s.selectElement);
  const exploded = useExplorer((s) => s.exploded);
  const toggleExploded = useExplorer((s) => s.toggleExploded);
  const isolateLevel = useExplorer((s) => s.isolateLevel);
  const setIsolateLevel = useExplorer((s) => s.setIsolateLevel);
  const hiddenKinds = useExplorer((s) => s.hiddenKinds);
  const toggleKind = useExplorer((s) => s.toggleKind);

  const elements = elementsFor(spec);
  const { w, d, h } = buildingBounds(spec);
  const levels = useMemo(() => [...new Set(elements.map((e) => e.level))].sort((a, b) => a - b), [elements]);
  const kinds = useMemo(() => [...new Set(elements.map((e) => e.kind))] as ElementKind[], [elements]);
  const typical = useMemo(() => {
    const seen = new Map<string, StructuralElement>();
    for (const el of elements) {
      const key = `${el.kind}:${JSON.stringify(el.section)}`;
      if (!seen.has(key)) seen.set(key, el);
    }
    return [...seen.values()].slice(0, 6);
  }, [elements]);

  return (
    <motion.div key={`b-${spec.id}`} {...enter} className="flex flex-col gap-8">
      {!locked && (
        <button type="button" onClick={() => selectBuilding(null)} className="label inline-flex min-h-[44px] w-fit items-center gap-2 hover:text-bone">
          <ArrowLeft className="h-3.5 w-3.5" /> All buildings
        </button>
      )}
      <div>
        <p className="label mb-4 text-sand">{SYSTEM_LABEL[spec.system]}</p>
        <h2 className="display text-[clamp(34px,3.3vw,52px)] [overflow-wrap:anywhere]">{spec.name}</h2>
        {project && (
          <Link to={`/projects/${project.slug}`} className="link-draw mt-3 inline-block text-[15px] text-bone-dim hover:text-bone">
            {project.title}
          </Link>
        )}
      </div>

      <dl>
        {project?.client && <Row label="Client" value={project.client} />}
        {project?.location && <Row label="Location" value={project.location} />}
        {project?.period && <Row label="Period" value={project.period} />}
        <Row label={spec.system === 'scaffold' ? 'Lifts' : 'Storeys'} value={String(spec.floors)} />
        <Row label="Grid" value={`${spec.baysX.length} × ${spec.baysZ.length} bays`} />
        <Row label="Footprint" value={`${fmt(w, 1)} × ${fmt(d, 1)} m`} />
        <Row label="Height" value={`${fmt(h, 1)} m`} />
      </dl>

      {project && (project.role || project.responsibilities.length > 0) && (
        <section aria-labelledby="resp">
          <p id="resp" className="label mb-3">My responsibility</p>
          {project.role && <p className="mb-4 text-[24px] font-medium leading-tight tracking-[-0.02em] text-sand">{project.role}</p>}
          <ul className="flex flex-col gap-2.5">
            {project.responsibilities.slice(0, 6).map((r) => (
              <li key={r} className="flex gap-3 text-[14px] leading-snug text-bone-dim">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-sand" />
                {r}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-4" aria-label="Model controls">
        <p className="label">Take it apart</p>
        <button type="button" aria-pressed={exploded} onClick={toggleExploded} className="chip w-fit">
          <Layers className="h-3.5 w-3.5" /> {exploded ? 'Close storeys' : 'Explode storeys'}
        </button>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="chip" aria-pressed={isolateLevel === null} onClick={() => setIsolateLevel(null)}>
            All
          </button>
          {levels.map((l) => (
            <button key={l} type="button" className="chip" aria-pressed={isolateLevel === l} onClick={() => setIsolateLevel(isolateLevel === l ? null : l)}>
              {l < 0 ? 'Fdn' : String(l + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
        {kinds.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {kinds.map((k) => (
              <button key={k} type="button" className="chip" aria-pressed={!hiddenKinds.includes(k)} onClick={() => toggleKind(k)}>
                {KIND_LABEL[k]}s
              </button>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="typ">
        <p id="typ" className="label mb-3">Typical members</p>
        <ul className="flex flex-col">
          {typical.map((el) => (
            <li key={el.id}>
              <button
                type="button"
                onClick={() => selectElement(el.id)}
                className="group flex w-full items-center justify-between gap-3 border-t border-white/[0.07] py-3 text-left"
              >
                <span className="text-[14px] text-bone group-hover:text-sand">{KIND_LABEL[el.kind]}</span>
                <span className="font-mono text-[12px] text-bone-mute">{sectionTitle(el)}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] text-bone-mute">Or click any member in the model.</p>
      </section>

      <Schedule spec={spec} />
    </motion.div>
  );
}

/* ── State C: one member ───────────────────────────────────── */

function ElementDetail({ el }: { el: StructuralElement }) {
  const selectElement = useExplorer((s) => s.selectElement);
  const openSection = useExplorer((s) => s.openSection);
  const showRebar = useExplorer((s) => s.showRebar);
  const toggleRebar = useExplorer((s) => s.toggleRebar);
  const hasCage = !!cageFor(el);
  const q = quantities(el);
  const facts = sectionFacts(el.section);
  const [sx, sy, sz] = el.size;
  const vertical = el.kind === 'column' || el.kind === 'wall' || (el.kind === 'tube' && sy > sx && sy > sz);

  return (
    <motion.div key={`e-${el.id}`} {...enter} className="flex flex-col gap-7">
      <button type="button" onClick={() => selectElement(null)} className="label inline-flex min-h-[44px] w-fit items-center gap-2 hover:text-bone">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to building
      </button>
      <div>
        <p className="label mb-4 text-sand">
          {KIND_LABEL[el.kind]} · {levelName(el.level)}
        </p>
        <h2 className="display text-[clamp(34px,3.3vw,52px)] [overflow-wrap:anywhere]">{el.label}</h2>
        {el.note && <p className="mt-3 text-[14px] text-bone-dim">{el.note}</p>}
      </div>

      <button
        type="button"
        onClick={() => openSection(true)}
        className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-950 p-4 transition-colors hover:border-sand"
        aria-label="Open the cross-section drawing"
      >
        <SectionDrawing section={el.section} />
        <span className="btn-solid absolute bottom-3 right-3 min-h-[40px] px-4 text-[11px]">
          <ScanLine className="h-3.5 w-3.5" /> Show section
        </span>
      </button>

      {hasCage && (
        <button type="button" aria-pressed={showRebar} onClick={toggleRebar} className="chip w-fit">
          <Layers className="h-3.5 w-3.5" /> {showRebar ? 'Hide reinforcement in 3D' : 'Show reinforcement in 3D'}
        </button>
      )}

      <dl>
        <Row label="Grid" value={el.grid} />
        <Row label={vertical ? 'Height' : 'Span'} value={`${fmt(el.length, 2)} m`} />
        {facts.slice(0, 5).map((f) => (
          <Row key={f.label} label={f.label} value={f.value} />
        ))}
        {q.concrete !== undefined && <Row label="Concrete" value={`${fmt(q.concrete, 2)} m³`} />}
        {q.steel !== undefined && <Row label="Rebar (approx.)" value={`${fmt(q.steel, 0)} kg`} />}
      </dl>
    </motion.div>
  );
}

export function ExplorerPanel({
  buildings,
  projects,
  locked,
}: {
  buildings: BuildingSpec[];
  projects: AnyProject[];
  locked: boolean;
}) {
  const buildingId = useExplorer((s) => s.buildingId);
  const elementId = useExplorer((s) => s.elementId);
  const spec = buildings.find((b) => b.id === buildingId);
  const el = spec && elementId ? elementsFor(spec).find((e) => e.id === elementId) : undefined;
  const project = spec ? projects.find((p) => p.slug === spec.projectSlug) : undefined;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!spec ? (
        <SiteList key="site" buildings={buildings} projects={projects} />
      ) : el ? (
        <ElementDetail key={el.id} el={el} />
      ) : (
        <BuildingDetail key={spec.id} spec={spec} project={project} locked={locked} />
      )}
    </AnimatePresence>
  );
}
