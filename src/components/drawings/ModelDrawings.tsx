import { useId, useMemo, useState } from 'react';
import type { BuildingSpec, StructuralElement } from '../../lib/structure/types';

/* Drawing colours, kept in step with the site tokens */
const C = { line: '#ece7df', dim: '#b9b3aa', mute: '#958f86', faint: '#4a4743', sand: '#c9a46c', cut: '#2a2826', ground: '#6b5a40' };

type Rect = { x0: number; z0: number; x1: number; z1: number };
const rectOf = (e: StructuralElement): Rect => {
  if (e.rotation) {
    // skewed member: draw along its axis (plan views only need the footprint)
    const [x, , z] = e.position;
    const a = e.rotation[1];
    const L = e.size[0] / 2;
    return { x0: x - Math.cos(a) * L, z0: z + Math.sin(a) * L, x1: x + Math.cos(a) * L, z1: z - Math.sin(a) * L };
  }
  return { x0: e.position[0] - e.size[0] / 2, z0: e.position[2] - e.size[2] / 2, x1: e.position[0] + e.size[0] / 2, z1: e.position[2] + e.size[2] / 2 };
};

function slabKind(e: StructuralElement) {
  if (e.kind === 'beam' && e.section.kind === 'rc-beam' && e.label.startsWith('Hidden')) return 'hidden';
  if (e.section.kind === 'ribbed-slab') return e.section.ribAxis === 'both' ? 'waffle' : e.section.ribAxis === 'x' ? 'rib-x' : 'rib-z';
  if (e.section.kind === 'rc-slab') return 'solid';
  return null;
}

function NorthArrow({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      <circle r={s} fill="none" stroke={C.mute} strokeWidth={s * 0.06} />
      <path d={`M0 ${-s * 0.85} L${s * 0.32} ${s * 0.5} L0 ${s * 0.22} L${-s * 0.32} ${s * 0.5} Z`} fill={C.sand} />
      <text y={-s * 1.25} fill={C.line} fontSize={s * 0.6} textAnchor="middle" fontFamily="JetBrains Mono, monospace">
        N
      </text>
    </g>
  );
}

function ScaleBar({ x, y, m = 5, u }: { x: number; y: number; m?: number; u: number }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      {Array.from({ length: m }, (_, i) => (
        <rect key={i} x={i} y={0} width={1} height={0.18} fill={i % 2 ? 'none' : C.dim} stroke={C.dim} strokeWidth={u * 0.6} />
      ))}
      <text x={0} y={0.75} fill={C.mute} fontSize={0.42} fontFamily="JetBrains Mono, monospace">
        0
      </text>
      <text x={m} y={0.75} fill={C.mute} fontSize={0.42} textAnchor="end" fontFamily="JetBrains Mono, monospace">
        {m} m
      </text>
    </g>
  );
}

/** Framing plan of one level, drawn from the model members. */
function Plan({ spec, level }: { spec: BuildingSpec; level: number }) {
  const uid = useId().replace(/:/g, '');
  const els = spec.imported!.elements;
  const { w, d } = spec.imported!.bounds;
  const pad = 3;
  const u = 0.03; // base stroke, metres
  const fnd = level < 0;
  const slabs = els.filter((e) => e.level === level && (e.kind === 'slab' || slabKind(e) === 'hidden'));
  const beams = els.filter((e) => e.level === level && e.kind === 'beam' && slabKind(e) !== 'hidden');
  const walls = els.filter((e) => e.level === level && (e.kind === 'wall' || e.kind === 'stair' || e.kind === 'ramp'));
  const cols = els.filter((e) => e.kind === 'column' && e.level === (fnd ? 0 : level));
  const footings = fnd ? els.filter((e) => e.kind === 'footing') : [];

  return (
    <svg viewBox={`${-w / 2 - pad} ${-d / 2 - pad} ${w + pad * 2} ${d + pad * 2 + 1.5}`} className="h-full w-full" role="img" aria-label={`Framing plan, ${fnd ? 'foundations' : spec.levelNames?.[level]}`}>
      <defs>
        <pattern id={`${uid}s`} width={0.35} height={0.35} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={0.35} stroke={C.faint} strokeWidth={u * 0.7} />
        </pattern>
        <pattern id={`${uid}x`} width={0.55} height={0.55} patternUnits="userSpaceOnUse">
          <line x1={0} y1={0.275} x2={0.55} y2={0.275} stroke={C.faint} strokeWidth={0.15} />
        </pattern>
        <pattern id={`${uid}z`} width={0.55} height={0.55} patternUnits="userSpaceOnUse">
          <line x1={0.275} y1={0} x2={0.275} y2={0.55} stroke={C.faint} strokeWidth={0.15} />
        </pattern>
      </defs>
      {slabs.map((e) => {
        const r = rectOf(e);
        const k = slabKind(e);
        const fill = k === 'solid' ? `url(#${uid}s)` : k === 'rib-x' || k === 'waffle' ? `url(#${uid}x)` : k === 'rib-z' ? `url(#${uid}z)` : 'none';
        return (
          <rect key={e.id} x={Math.min(r.x0, r.x1)} y={Math.min(r.z0, r.z1)} width={Math.abs(r.x1 - r.x0)} height={Math.abs(r.z1 - r.z0)} fill={fill} stroke={k === 'hidden' ? C.sand : C.mute} strokeWidth={u} strokeDasharray={k === 'hidden' ? '0.25 0.15' : undefined}>
            <title>{`${e.label} · ${e.story} · ${k === 'hidden' ? 'hidden beam' : k === 'solid' ? (e.section.kind === 'rc-slab' && e.section.drop ? 'flat slab with drop panels' : 'solid slab') : k === 'waffle' ? 'waffle slab' : 'hollow-block slab'}`}</title>
          </rect>
        );
      })}
      {footings.map((e) => {
        const r = rectOf(e);
        return (
          <rect key={e.id} x={Math.min(r.x0, r.x1)} y={Math.min(r.z0, r.z1)} width={Math.abs(r.x1 - r.x0)} height={Math.abs(r.z1 - r.z0)} fill="none" stroke={C.dim} strokeWidth={u * 1.4}>
            <title>{`${e.label} · ${Math.abs(r.x1 - r.x0).toFixed(2)} × ${Math.abs(r.z1 - r.z0).toFixed(2)} m`}</title>
          </rect>
        );
      })}
      {beams.map((e) => {
        const r = rectOf(e);
        if (e.rotation) return <line key={e.id} x1={r.x0} y1={r.z0} x2={r.x1} y2={r.z1} stroke={C.line} strokeWidth={e.size[2]} strokeOpacity={0.55} />;
        return (
          <rect key={e.id} x={r.x0} y={r.z0} width={r.x1 - r.x0} height={r.z1 - r.z0} fill="#0f0f10" stroke={C.line} strokeWidth={u}>
            <title>{`${e.label} · ${e.story ?? ''} · ${e.section.kind === 'rc-beam' ? `${e.section.b}×${e.section.h}` : ''}`}</title>
          </rect>
        );
      })}
      {walls.map((e) => {
        const r = rectOf(e);
        const wall = e.kind === 'wall';
        const title = <title>{`${e.label} · ${e.story ?? ''} · ${e.kind}`}</title>;
        if (e.rotation) return <line key={e.id} x1={r.x0} y1={r.z0} x2={r.x1} y2={r.z1} stroke={wall ? C.dim : C.mute} strokeWidth={e.size[2]} strokeOpacity={wall ? 0.9 : 0.3}>{title}</line>;
        return (
          <rect key={e.id} x={r.x0} y={r.z0} width={r.x1 - r.x0} height={r.z1 - r.z0} fill={wall ? C.dim : 'none'} stroke={C.line} strokeWidth={u} strokeDasharray={wall ? undefined : '0.25 0.15'}>
            {title}
          </rect>
        );
      })}
      {cols.map((e) => {
        const r = rectOf(e);
        return (
          <rect key={e.id} x={r.x0} y={r.z0} width={r.x1 - r.x0} height={r.z1 - r.z0} fill={C.sand}>
            <title>{`${e.label} · ${e.section.kind === 'rc-column' ? `${e.section.b}×${e.section.h} · ${e.section.bars.n}T${e.section.bars.dia}` : ''}`}</title>
          </rect>
        );
      })}
      {/* overall dimensions */}
      <g stroke={C.mute} strokeWidth={u} fill="none">
        <line x1={-w / 2} y1={d / 2 + 1.2} x2={w / 2} y2={d / 2 + 1.2} />
        <line x1={-w / 2} y1={d / 2 + 0.9} x2={-w / 2} y2={d / 2 + 1.5} />
        <line x1={w / 2} y1={d / 2 + 0.9} x2={w / 2} y2={d / 2 + 1.5} />
        <line x1={w / 2 + 1.2} y1={-d / 2} x2={w / 2 + 1.2} y2={d / 2} />
        <line x1={w / 2 + 0.9} y1={-d / 2} x2={w / 2 + 1.5} y2={-d / 2} />
        <line x1={w / 2 + 0.9} y1={d / 2} x2={w / 2 + 1.5} y2={d / 2} />
      </g>
      <text x={0} y={d / 2 + 1.0} fill={C.dim} fontSize={0.5} textAnchor="middle" fontFamily="JetBrains Mono, monospace">
        {w.toFixed(2)} m
      </text>
      <text x={w / 2 + 1.0} y={0} fill={C.dim} fontSize={0.5} textAnchor="middle" fontFamily="JetBrains Mono, monospace" transform={`rotate(90 ${w / 2 + 1.0} 0)`}>
        {d.toFixed(2)} m
      </text>
      <NorthArrow x={-w / 2 - 1.4} y={-d / 2 - 1.2} s={0.8} />
      <ScaleBar x={-w / 2} y={d / 2 + 2.3} u={u} />
    </svg>
  );
}

/** Building section through the model at a plane, looking north (cut along X) or west (cut along Y). */
function Section({ spec, axis, at }: { spec: BuildingSpec; axis: 'x' | 'z'; at: number }) {
  const imp = spec.imported!;
  const span = axis === 'x' ? imp.bounds.w : imp.bounds.d;
  const lo = imp.levels[0].z - 0.8;
  const hi = imp.levels[imp.levels.length - 1].z + 1.2;
  const pad = 3.2;
  const u = 0.03;
  // A–A looks north (screen x = world x); B–B looks west (screen x = −world z, south on the left)
  const range = (e: StructuralElement) => {
    const r = rectOf(e);
    return axis === 'x' ? [Math.min(r.z0, r.z1), Math.max(r.z0, r.z1)] : [Math.min(r.x0, r.x1), Math.max(r.x0, r.x1)];
  };
  const members = imp.elements.filter((e) => !e.rotation);
  const cut = members.filter((e) => {
    const [a0, a1] = range(e);
    return at >= a0 && at <= a1;
  });
  // beyond the cut, in the viewing direction: drawn as faint outlines, like a far-clip elevation
  const beyond = members.filter((e) => range(e)[1] < at && !cut.includes(e));
  const h0 = (e: StructuralElement) => (axis === 'x' ? rectOf(e).x0 : -rectOf(e).z1);
  const h1 = (e: StructuralElement) => (axis === 'x' ? rectOf(e).x1 : -rectOf(e).z0);
  const y = (v: number) => -v;

  return (
    <svg viewBox={`${-span / 2 - pad} ${y(hi) - 0.5} ${span + pad * 2} ${hi - lo + 1.5}`} className="h-full w-full" role="img" aria-label={`Building section ${axis === 'x' ? 'A–A' : 'B–B'}`}>
      {/* ground */}
      <line x1={-span / 2 - 1.5} y1={0} x2={span / 2 + 1.5} y2={0} stroke={C.ground} strokeWidth={u * 2} />
      {imp.levels.map((l) => (
        <g key={l.name}>
          <line x1={-span / 2 - 2.6} y1={y(l.z)} x2={span / 2 + 0.6} y2={y(l.z)} stroke={C.faint} strokeWidth={u} strokeDasharray="0.3 0.2" />
          <path d={`M${-span / 2 - 2.6} ${y(l.z) - 0.02} l0.25 -0.32 h-0.5 z`} fill={C.sand} />
          <text x={-span / 2 - 2.25} y={y(l.z) - 0.42} fill={C.line} fontSize={0.42} fontFamily="JetBrains Mono, monospace">
            {l.name}
          </text>
          <text x={-span / 2 - 2.25} y={y(l.z) + 0.55} fill={C.mute} fontSize={0.36} fontFamily="JetBrains Mono, monospace">
            {(l.z >= 0 ? '+' : '−') + Math.abs(l.z).toFixed(2)}
          </text>
        </g>
      ))}
      {beyond.map((e) => {
        const top = e.position[1] + e.size[1] / 2;
        const bot = e.position[1] - e.size[1] / 2;
        return <rect key={`b${e.id}`} x={Math.min(h0(e), h1(e))} y={y(top)} width={Math.abs(h1(e) - h0(e))} height={top - bot} fill="none" stroke={C.mute} strokeOpacity={0.35} strokeWidth={u * 0.8} />;
      })}
      {cut.map((e) => {
        const top = e.position[1] + e.size[1] / 2;
        const bot = e.position[1] - e.size[1] / 2;
        const isSlab = e.kind === 'slab' || e.label.startsWith('Hidden');
        return (
          <rect key={e.id} x={Math.min(h0(e), h1(e))} y={y(top)} width={Math.abs(h1(e) - h0(e))} height={top - bot} fill={e.kind === 'column' ? C.cut : isSlab ? '#3b3833' : '#4a4640'} stroke={C.line} strokeWidth={u}>
            <title>{`${e.label} · ${e.story ?? ''}`}</title>
          </rect>
        );
      })}
      <text x={span / 2} y={y(hi) + 0.1} fill={C.mute} fontSize={0.38} textAnchor="end" fontFamily="JetBrains Mono, monospace">
        {axis === 'x' ? `Section A–A · looking north · cut at y = ${(-at).toFixed(2)} m` : `Section B–B · looking west · cut at x = ${at.toFixed(2)} m`}
      </text>
    </svg>
  );
}

/** Framing plans per level and a movable section, both drawn live from the imported model. */
export function ModelDrawings({ spec, labels }: { spec: BuildingSpec; labels: { plans: string; section: string; foundations: string; cutAlong: string; position: string; note: string } }) {
  const imp = spec.imported;
  const [view, setView] = useState<'plan' | 'section'>('plan');
  const [level, setLevel] = useState(1);
  const [axis, setAxis] = useState<'x' | 'z'>('x');
  // start the cut through the built block: the median slab position across the cut
  const start = (ax: 'x' | 'z') => {
    const v = (imp?.elements ?? []).filter((e) => e.kind === 'slab').map((e) => (ax === 'x' ? e.position[2] : e.position[0])).sort((a, b) => a - b);
    return v.length ? Math.round(v[Math.floor(v.length / 2)] * 20) / 20 : 0;
  };
  const [at, setAt] = useState(() => start('x'));
  const levels = useMemo(() => [-1, ...(spec.levelNames ?? []).map((_, i) => i)], [spec.levelNames]);
  if (!imp) return null;
  const span = axis === 'x' ? imp.bounds.d : imp.bounds.w;

  return (
    <div className="border border-white/10 bg-ink-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-3 sm:p-4" lang="en" dir="ltr">
        <div className="flex gap-2" role="group" aria-label="Drawing">
          {(['plan', 'section'] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} className="chip" onClick={() => setView(v)}>
              {v === 'plan' ? labels.plans : labels.section}
            </button>
          ))}
        </div>
        {view === 'plan' ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Level">
            {levels.map((l) => (
              <button key={l} type="button" className="chip" aria-pressed={level === l} onClick={() => setLevel(l)}>
                {l < 0 ? labels.foundations : spec.levelNames?.[l]}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2" role="group" aria-label={labels.cutAlong}>
              <button type="button" className="chip" aria-pressed={axis === 'x'} onClick={() => (setAxis('x'), setAt(start('x')))}>
                A–A
              </button>
              <button type="button" className="chip" aria-pressed={axis === 'z'} onClick={() => (setAxis('z'), setAt(start('z')))}>
                B–B
              </button>
            </div>
            <label className="flex items-center gap-3">
              <span className="label">{labels.position}</span>
              <input type="range" min={-span / 2} max={span / 2} step={0.05} value={at} onChange={(e) => setAt(Number(e.target.value))} className="w-36 accent-[#c9a46c]" />
            </label>
          </div>
        )}
      </div>
      <div className="aspect-[4/3] w-full p-2 sm:aspect-[16/10] sm:p-4" lang="en" dir="ltr">
        {view === 'plan' ? <Plan spec={spec} level={level} /> : <Section spec={spec} axis={axis} at={at} />}
      </div>
      <p className="border-t border-white/10 px-4 py-3 text-[13px] leading-snug text-bone-mute">{labels.note}</p>
    </div>
  );
}
