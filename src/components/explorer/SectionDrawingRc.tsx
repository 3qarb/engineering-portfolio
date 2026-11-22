// Section drawings for the concrete members added with the element library:
// circular columns, flat slabs at the drop panel, walls, stairs and ramps. Units: mm.
import type { Section } from '../../lib/structure/types';
import { Callout, Dim, Hatch } from './drawing';
import { C, frame, fs, sw } from './drawingKit';

type Of<K extends Section['kind']> = Extract<Section, { kind: K }>;

/** Evenly spaced positions across a length, centred, at a bar spacing. */
const across = (len: number, spacing: number, edge: number) => {
  const n = Math.max(1, Math.floor((len - 2 * edge) / spacing) + 1);
  const start = (len - (n - 1) * spacing) / 2;
  return Array.from({ length: n }, (_, i) => start + i * spacing);
};

export function CircleColumn({ s }: { s: Of<'rc-column'> }) {
  const D = s.b;
  const r = D / 2;
  return frame(D, D, (ctx) => {
    const rt = r - s.cover - s.ties.dia / 2;
    const rb = r - s.cover - s.ties.dia - s.bars.dia / 2;
    const pts = Array.from({ length: s.bars.n }, (_, i) => {
      const a = (i / s.bars.n) * Math.PI * 2 - Math.PI / 2;
      return [r + rb * Math.cos(a), r + rb * Math.sin(a)] as const;
    });
    return (
      <>
        <Hatch id="hcc" ctx={ctx} />
        <circle cx={r} cy={r} r={r} fill="url(#hcc)" stroke={C.line} strokeWidth={sw(ctx, 2)} />
        <circle cx={r} cy={r} r={rt} fill="none" stroke={C.steel} strokeWidth={s.ties.dia} />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={s.bars.dia / 2} fill={C.steel} />
        ))}
        <Dim ctx={ctx} x1={0} y1={D} x2={D} y2={D} off={ctx.u * 0.14} text={`Ø${D}`} />
        <Callout ctx={ctx} x={pts[0][0]} y={pts[0][1]} tx={-ctx.u * 0.16} ty={-ctx.u * 0.12} text={`${s.bars.n} T${s.bars.dia}`} />
        <Callout ctx={ctx} x={r - rt} y={r} tx={-ctx.u * 0.16} ty={r} text={`spiral T${s.ties.dia}@${s.ties.spacing}`} />
      </>
    );
  });
}

export function DropSlab({ s }: { s: Of<'rc-slab'> }) {
  const drop = s.drop!;
  const W = Math.round(drop.size * 1.7);
  const H = s.t + drop.t;
  const x0 = (W - drop.size) / 2;
  return frame(W, H, (ctx) => {
    const yb = s.t - s.cover - s.bottom.dia / 2;
    const top = s.top;
    const yt = s.cover + (top?.dia ?? 0) / 2;
    return (
      <>
        <Hatch id="hds" ctx={ctx} />
        <path d={`M0 0 H${W} V${s.t} H${x0 + drop.size} V${H} H${x0} V${s.t} H0 Z`} fill="url(#hds)" stroke={C.line} strokeWidth={sw(ctx, 2)} />
        <rect x={(W - 400) / 2} y={H} width={400} height={ctx.u * 0.12} fill="none" stroke={C.mute} strokeWidth={sw(ctx, 1.4)} strokeDasharray={`${sw(ctx, 8)} ${sw(ctx, 5)}`} />
        {across(W, s.bottom.spacing, s.cover).map((x) => (
          <circle key={`b${x}`} cx={x} cy={yb} r={s.bottom.dia / 2} fill={C.steel} />
        ))}
        {top && (
          <>
            <line x1={s.cover} x2={W - s.cover} y1={yt + top.dia} y2={yt + top.dia} stroke={C.steel} strokeWidth={top.dia * 0.8} />
            {across(W, top.spacing, s.cover).map((x) => (
              <circle key={`t${x}`} cx={x} cy={yt} r={top.dia / 2} fill={C.steel} />
            ))}
            <Callout ctx={ctx} x={W - s.cover} y={yt} tx={W + ctx.u * 0.04} ty={-ctx.u * 0.06} text={`T${top.dia}@${top.spacing} T`} />
          </>
        )}
        <Dim ctx={ctx} x1={x0} y1={H} x2={x0 + drop.size} y2={H} off={ctx.u * 0.16} text={`drop ${drop.size}`} />
        <Dim ctx={ctx} x1={W} y1={0} x2={W} y2={s.t} off={ctx.u * 0.04} text={`${s.t}`} vertical />
        <Dim ctx={ctx} x1={x0 + drop.size} y1={s.t} x2={x0 + drop.size} y2={H} off={ctx.u * 0.12} text={`+${drop.t}`} vertical />
        <Callout ctx={ctx} x={across(W, s.bottom.spacing, s.cover)[0]} y={yb} tx={-ctx.u * 0.04} ty={H + ctx.u * 0.06} text={`T${s.bottom.dia}@${s.bottom.spacing} B`} />
      </>
    );
  }, 0.18);
}

/** Plan section through 1 m of wall. */
export function WallSection({ s }: { s: Of<'rc-wall'> }) {
  const L = 1000;
  return frame(L, s.t, (ctx) => {
    const h = s.horizontal.dia;
    const v = s.vertical.dia;
    const faces = s.layers === 2 ? [s.cover + h + v / 2, s.t - s.cover - h - v / 2] : [s.t / 2];
    const hLines = s.layers === 2 ? [s.cover + h / 2, s.t - s.cover - h / 2] : [s.t / 2 - v / 2 - h / 2];
    const xs = across(L, s.vertical.spacing, s.cover);
    return (
      <>
        <Hatch id="hw" ctx={ctx} />
        <rect width={L} height={s.t} fill="url(#hw)" stroke={C.line} strokeWidth={sw(ctx, 2)} />
        {hLines.map((y) => (
          <line key={y} x1={s.cover} x2={L - s.cover} y1={y} y2={y} stroke={C.steel} strokeWidth={h * 0.8} />
        ))}
        {faces.flatMap((y) => xs.map((x) => <circle key={`${x}|${y}`} cx={x} cy={y} r={v / 2} fill={C.steel} />))}
        <Dim ctx={ctx} x1={0} y1={s.t} x2={L} y2={s.t} off={ctx.u * 0.1} text="1000 length" />
        <Dim ctx={ctx} x1={L} y1={0} x2={L} y2={s.t} off={ctx.u * 0.05} text={`${s.t}`} vertical />
        <Callout ctx={ctx} x={xs[0]} y={faces[0]} tx={-ctx.u * 0.05} ty={-ctx.u * 0.08} text={`T${v}@${s.vertical.spacing} V${s.layers === 2 ? ' EF' : ''}`} />
        <Callout ctx={ctx} x={L * 0.62} y={hLines[hLines.length - 1]} tx={L * 0.7} ty={s.t + ctx.u * 0.2} text={`T${h}@${s.horizontal.spacing} H${s.layers === 2 ? ' EF' : ''}`} />
      </>
    );
  }, 0.25);
}

/** Long section through a flight: steps on a waist slab, main bars along the soffit. */
export function StairSection({ s }: { s: Of<'stair'> }) {
  const { riser: R, tread: T, steps: n, waist } = s;
  const run = n * T;
  const H = n * R;
  const cos = T / Math.hypot(T, R);
  const wv = waist / cos;
  const soffit = (x: number) => R + (x * R) / T - wv;
  return frame(run, H, (ctx) => {
    const y = (h: number) => H - h;
    const pts: string[] = [`0,${y(0)}`, `0,${y(R)}`];
    for (let i = 1; i < n; i++) pts.push(`${i * T},${y(i * R)}`, `${i * T},${y((i + 1) * R)}`);
    pts.push(`${run},${y(H)}`, `${run},${y(Math.min(H, soffit(run)))}`);
    const x0 = Math.max(0, ((wv - R) * T) / R);
    pts.push(`${x0},${y(Math.max(0, soffit(x0)))}`);
    if (x0 > 0) pts.push(`${0},${y(0)}`);
    const lift = (s.cover + s.main.dia / 2) / cos;
    const a = s.cover + x0;
    const b = run - s.cover;
    const dist = across(b - a, s.distribution.spacing * cos, 0).map((d) => a + d);
    return (
      <>
        <Hatch id="hst" ctx={ctx} />
        <polygon points={pts.join(' ')} fill="url(#hst)" stroke={C.line} strokeWidth={sw(ctx, 2)} strokeLinejoin="round" />
        <line x1={a} y1={y(soffit(a) + lift)} x2={b} y2={y(soffit(b) + lift)} stroke={C.steel} strokeWidth={s.main.dia * 0.9} />
        {dist.map((x) => (
          <circle key={x} cx={x} cy={y(soffit(x) + lift + (s.main.dia + s.distribution.dia) / 2 / cos)} r={s.distribution.dia / 2} fill={C.steel} />
        ))}
        <Dim ctx={ctx} x1={0} y1={y(0)} x2={T} y2={y(0)} off={ctx.u * 0.06} text={`${T}`} />
        <Dim ctx={ctx} x1={0} y1={y(0)} x2={0} y2={y(R)} off={-ctx.u * 0.06} text={`${R}`} vertical />
        <Dim ctx={ctx} x1={run} y1={y(0)} x2={run} y2={y(H)} off={ctx.u * 0.05} text={`${n} × ${R}`} vertical />
        <Callout ctx={ctx} x={(a + b) / 2} y={y(soffit((a + b) / 2) + lift)} tx={run * 0.62} ty={H + ctx.u * 0.05} text={`T${s.main.dia}@${s.main.spacing} main · waist ${waist}`} />
        <Callout ctx={ctx} x={dist[1] ?? dist[0]} y={y(soffit(dist[1] ?? dist[0]) + lift)} tx={-ctx.u * 0.04} ty={H * 0.25} text={`T${s.distribution.dia}@${s.distribution.spacing} dist.`} />
        <text x={run * 0.2} y={y(H) + fs(ctx)} fill={C.mute} fontSize={fs(ctx) * 0.85} fontFamily="JetBrains Mono, monospace">
          2R + T = {2 * R + T}
        </text>
      </>
    );
  }, 0.2);
}

/** Long section through 3 m of ramp at its slope. */
export function RampSection({ s }: { s: Of<'ramp'> }) {
  const L = 3000;
  const rise = (L * s.slope) / 100;
  const cos = 1 / Math.hypot(1, s.slope / 100);
  const tv = s.t / cos;
  const H = rise + tv;
  return frame(L, H, (ctx) => {
    const y = (h: number) => H - h;
    const at = (x: number, off: number) => (x * s.slope) / 100 + off / cos;
    const bOff = s.cover + s.bottom.dia / 2;
    const top = s.top;
    const tOff = s.t - s.cover - (top?.dia ?? 0) / 2;
    const xs = across(L, s.bottom.spacing * cos, s.cover);
    return (
      <>
        <Hatch id="hrp" ctx={ctx} />
        <polygon points={`0,${y(0)} ${L},${y(rise)} ${L},${y(H)} 0,${y(tv)}`} fill="url(#hrp)" stroke={C.line} strokeWidth={sw(ctx, 2)} />
        <line x1={s.cover} y1={y(at(s.cover, bOff))} x2={L - s.cover} y2={y(at(L - s.cover, bOff))} stroke={C.steel} strokeWidth={s.bottom.dia * 0.9} />
        {xs.map((x) => (
          <circle key={x} cx={x} cy={y(at(x, bOff + s.bottom.dia))} r={s.bottom.dia / 2} fill={C.steel} />
        ))}
        {top && <line x1={s.cover} y1={y(at(s.cover, tOff))} x2={L - s.cover} y2={y(at(L - s.cover, tOff))} stroke={C.steel} strokeWidth={top.dia * 0.9} />}
        <Dim ctx={ctx} x1={0} y1={y(0)} x2={L} y2={y(0)} off={ctx.u * 0.06} text={`${L} · ${s.slope}% slope`} />
        <Dim ctx={ctx} x1={L} y1={y(rise)} x2={L} y2={y(H)} off={ctx.u * 0.04} text={`${s.t}`} vertical />
        <Callout ctx={ctx} x={L * 0.3} y={y(at(L * 0.3, bOff))} tx={L * 0.4} ty={H + ctx.u * 0.03} text={`T${s.bottom.dia}@${s.bottom.spacing} B`} />
        {top && <Callout ctx={ctx} x={L * 0.6} y={y(at(L * 0.6, tOff))} tx={L * 0.45} ty={-ctx.u * 0.04} text={`T${top.dia}@${top.spacing} T`} />}
      </>
    );
  }, 0.16);
}
