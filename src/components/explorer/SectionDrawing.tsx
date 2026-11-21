import type { ReactNode } from 'react';
import type { Section } from '../../lib/structure/types';
import { perimeterBars } from '../../lib/structure/rebar';

/* Drawing colours, kept in sync with the theme tokens */
const C = {
  line: '#ece7df',
  mute: '#8a857d',
  steel: '#c9a46c',
  concrete: '#1d1c1b',
  hatch: '#3a3835',
  stone: '#2b2620',
  timber: '#3a2a1b',
};

interface Ctx {
  /** reference size (mm) used to scale strokes and text */
  u: number;
}

const sw = (ctx: Ctx, k = 1) => (ctx.u / 420) * k;
const fs = (ctx: Ctx) => ctx.u * 0.05;

function Dim({
  ctx,
  x1,
  y1,
  x2,
  y2,
  off,
  text,
  vertical = false,
}: {
  ctx: Ctx;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  off: number;
  text: string;
  vertical?: boolean;
}) {
  const tick = ctx.u * 0.022;
  const s = sw(ctx);
  if (vertical) {
    const x = x1 + off;
    return (
      <g stroke={C.mute} strokeWidth={s} fill="none">
        <line x1={x1} y1={y1} x2={x + tick} y2={y1} strokeDasharray={`${s * 4} ${s * 3}`} />
        <line x1={x2} y1={y2} x2={x + tick} y2={y2} strokeDasharray={`${s * 4} ${s * 3}`} />
        <line x1={x} y1={y1} x2={x} y2={y2} />
        <line x1={x - tick} y1={y1 + tick} x2={x + tick} y2={y1 - tick} />
        <line x1={x - tick} y1={y2 + tick} x2={x + tick} y2={y2 - tick} />
        <text
          x={x + tick * 2.2}
          y={(y1 + y2) / 2}
          fill={C.line}
          stroke="none"
          fontSize={fs(ctx)}
          fontFamily="JetBrains Mono, monospace"
          dominantBaseline="middle"
        >
          {text}
        </text>
      </g>
    );
  }
  const y = y1 + off;
  return (
    <g stroke={C.mute} strokeWidth={s} fill="none">
      <line x1={x1} y1={y1} x2={x1} y2={y + tick} strokeDasharray={`${s * 4} ${s * 3}`} />
      <line x1={x2} y1={y2} x2={x2} y2={y + tick} strokeDasharray={`${s * 4} ${s * 3}`} />
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1 - tick} y1={y + tick} x2={x1 + tick} y2={y - tick} />
      <line x1={x2 - tick} y1={y + tick} x2={x2 + tick} y2={y - tick} />
      <text
        x={(x1 + x2) / 2}
        y={y + tick * 3.4}
        fill={C.line}
        stroke="none"
        fontSize={fs(ctx)}
        fontFamily="JetBrains Mono, monospace"
        textAnchor="middle"
      >
        {text}
      </text>
    </g>
  );
}

function Callout({ ctx, x, y, tx, ty, text }: { ctx: Ctx; x: number; y: number; tx: number; ty: number; text: string }) {
  const s = sw(ctx);
  const right = tx > x;
  return (
    <g>
      <circle cx={x} cy={y} r={s * 3} fill={C.steel} />
      <polyline points={`${x},${y} ${tx},${ty} ${tx + (right ? 1 : -1) * ctx.u * 0.06},${ty}`} stroke={C.steel} strokeWidth={s} fill="none" />
      <text
        x={tx + (right ? 1 : -1) * ctx.u * 0.08}
        y={ty}
        fill={C.steel}
        fontSize={fs(ctx)}
        fontFamily="JetBrains Mono, monospace"
        textAnchor={right ? 'start' : 'end'}
        dominantBaseline="middle"
      >
        {text}
      </text>
    </g>
  );
}

function Hatch({ id, ctx }: { id: string; ctx: Ctx }) {
  const p = ctx.u / 18;
  return (
    <defs>
      <pattern id={id} width={p} height={p} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width={p} height={p} fill={C.concrete} />
        <line x1="0" y1="0" x2="0" y2={p} stroke={C.hatch} strokeWidth={sw(ctx, 1.2)} />
      </pattern>
    </defs>
  );
}

function frame(w: number, h: number, children: (ctx: Ctx) => ReactNode, pad = 0.55) {
  const u = Math.max(w, h);
  const ctx = { u };
  const m = u * pad;
  return (
    <svg
      viewBox={`${-m} ${-m * 0.7} ${w + m * 2} ${h + m * 1.6}`}
      className="h-full w-full"
      role="img"
      aria-label="Cross-section drawing"
    >
      {children(ctx)}
    </svg>
  );
}

export function SectionDrawing({ section }: { section: Section }) {
  switch (section.kind) {
    case 'rc-column': {
      const { b, h, cover, bars, ties } = section;
      return frame(b, h, (ctx) => {
        const ti = cover + ties.dia / 2;
        const e = cover + ties.dia + bars.dia / 2;
        const pts = perimeterBars(bars.n, e, e, b - 2 * e, h - 2 * e);
        return (
          <>
            <Hatch id="hc" ctx={ctx} />
            <rect width={b} height={h} fill="url(#hc)" stroke={C.line} strokeWidth={sw(ctx, 2)} />
            {section.jacketFrom && (
              <rect
                x={(b - section.jacketFrom.b) / 2}
                y={(h - section.jacketFrom.h) / 2}
                width={section.jacketFrom.b}
                height={section.jacketFrom.h}
                fill="none"
                stroke={C.mute}
                strokeWidth={sw(ctx, 1.4)}
                strokeDasharray={`${sw(ctx, 8)} ${sw(ctx, 5)}`}
              />
            )}
            <rect
              x={ti}
              y={ti}
              width={b - 2 * ti}
              height={h - 2 * ti}
              rx={ties.dia * 2}
              fill="none"
              stroke={C.steel}
              strokeWidth={ties.dia}
            />
            {pts.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={bars.dia / 2} fill={C.steel} />
            ))}
            <Dim ctx={ctx} x1={0} y1={h} x2={b} y2={h} off={ctx.u * 0.14} text={`${b}`} />
            <Dim ctx={ctx} x1={b} y1={0} x2={b} y2={h} off={ctx.u * 0.14} text={`${h}`} vertical />
            <Callout ctx={ctx} x={pts[0][0]} y={pts[0][1]} tx={-ctx.u * 0.16} ty={-ctx.u * 0.16} text={`${bars.n} T${bars.dia}`} />
            <Callout ctx={ctx} x={ti} y={h * 0.62} tx={-ctx.u * 0.16} ty={h * 0.62} text={`T${ties.dia}@${ties.spacing}`} />
            <Dim ctx={ctx} x1={0} y1={0} x2={cover} y2={0} off={-ctx.u * 0.1} text={`c${cover}`} />
            {section.jacketFrom && (
              <text
                x={b / 2}
                y={h / 2}
                fill={C.mute}
                fontSize={fs(ctx) * 0.85}
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                existing {section.jacketFrom.b}×{section.jacketFrom.h}
              </text>
            )}
          </>
        );
      });
    }

    case 'rc-beam': {
      const { b, h, cover, top, bottom, stirrups } = section;
      return frame(b, h, (ctx) => {
        const si = cover + stirrups.dia / 2;
        const et = cover + stirrups.dia + top.dia / 2;
        const eb = cover + stirrups.dia + bottom.dia / 2;
        const row = (n: number, y: number, e: number) =>
          Array.from({ length: n }, (_, i) => [n === 1 ? b / 2 : e + ((b - 2 * e) * i) / (n - 1), y] as const);
        const tops = row(top.n, et, et);
        const bots = row(bottom.n, h - eb, eb);
        const d = h - eb;
        return (
          <>
            <Hatch id="hb" ctx={ctx} />
            <rect width={b} height={h} fill="url(#hb)" stroke={C.line} strokeWidth={sw(ctx, 2)} />
            <rect x={si} y={si} width={b - 2 * si} height={h - 2 * si} rx={stirrups.dia * 2} fill="none" stroke={C.steel} strokeWidth={stirrups.dia} />
            {tops.map(([x, y], i) => (
              <circle key={`t${i}`} cx={x} cy={y} r={top.dia / 2} fill={C.steel} />
            ))}
            {bots.map(([x, y], i) => (
              <circle key={`b${i}`} cx={x} cy={y} r={bottom.dia / 2} fill={C.steel} />
            ))}
            <Dim ctx={ctx} x1={0} y1={h} x2={b} y2={h} off={ctx.u * 0.12} text={`${b}`} />
            <Dim ctx={ctx} x1={b} y1={0} x2={b} y2={h} off={ctx.u * 0.1} text={`${h}`} vertical />
            <Dim ctx={ctx} x1={b} y1={0} x2={b} y2={d} off={ctx.u * 0.3} text={`d ${Math.round(d)}`} vertical />
            <Callout ctx={ctx} x={tops[0][0]} y={tops[0][1]} tx={-ctx.u * 0.12} ty={-ctx.u * 0.08} text={`${top.n} T${top.dia}`} />
            <Callout ctx={ctx} x={bots[0][0]} y={bots[0][1]} tx={-ctx.u * 0.12} ty={h + ctx.u * 0.06} text={`${bottom.n} T${bottom.dia}`} />
            <Callout ctx={ctx} x={si} y={h / 2} tx={-ctx.u * 0.12} ty={h / 2} text={`T${stirrups.dia}@${stirrups.spacing}`} />
          </>
        );
      });
    }

    case 'rc-slab': {
      const W = 1000;
      const { t, cover, bottom, top } = section;
      return frame(W, t, (ctx) => {
        const nb = Math.floor(W / bottom.spacing);
        const yb = t - cover - bottom.dia / 2;
        const nt = top ? Math.floor(W / top.spacing) : 0;
        const yt = top ? cover + top.dia / 2 : 0;
        return (
          <>
            <Hatch id="hs" ctx={ctx} />
            <rect width={W} height={t} fill="url(#hs)" stroke={C.line} strokeWidth={sw(ctx, 2)} />
            <line x1={10} x2={W - 10} y1={yb - bottom.dia} y2={yb - bottom.dia} stroke={C.steel} strokeWidth={bottom.dia * 0.8} />
            {Array.from({ length: nb }, (_, i) => (
              <circle key={i} cx={bottom.spacing / 2 + i * bottom.spacing} cy={yb} r={bottom.dia / 2} fill={C.steel} />
            ))}
            {top && (
              <>
                <line x1={10} x2={W - 10} y1={yt + top.dia} y2={yt + top.dia} stroke={C.steel} strokeWidth={top.dia * 0.8} />
                {Array.from({ length: nt }, (_, i) => (
                  <circle key={i} cx={top.spacing / 2 + i * top.spacing} cy={yt} r={top.dia / 2} fill={C.steel} />
                ))}
              </>
            )}
            <Dim ctx={ctx} x1={0} y1={t} x2={W} y2={t} off={ctx.u * 0.08} text="1000 strip" />
            <Dim ctx={ctx} x1={W} y1={0} x2={W} y2={t} off={ctx.u * 0.05} text={`${t}`} vertical />
            <Callout ctx={ctx} x={bottom.spacing / 2} y={yb} tx={-ctx.u * 0.05} ty={t + ctx.u * 0.04} text={`T${bottom.dia}@${bottom.spacing} B`} />
            {top && <Callout ctx={ctx} x={top.spacing / 2} y={yt} tx={-ctx.u * 0.05} ty={-ctx.u * 0.05} text={`T${top.dia}@${top.spacing} T`} />}
          </>
        );
      }, 0.22);
    }

    case 'ribbed-slab': {
      const { depth, topping, ribWidth, ribSpacing, ribBars, ribLinks, cover } = section;
      const W = ribSpacing * 2 + ribWidth;
      return frame(W, depth, (ctx) => {
        const ribs = [ribWidth / 2, ribWidth / 2 + ribSpacing, ribWidth / 2 + ribSpacing * 2];
        const bar = (n: number, dia: number, x: number, y: number) =>
          Array.from({ length: n }, (_, i) => (
            <circle key={i} cx={n === 1 ? x : x - ribWidth / 2 + cover + ribLinks.dia + dia / 2 + ((ribWidth - 2 * (cover + ribLinks.dia) - dia) * i) / (n - 1)} cy={y} r={dia / 2} fill={C.steel} />
          ));
        const yb = depth - cover - ribLinks.dia - ribBars.bottom.dia / 2;
        const yt = cover + ribLinks.dia + ribBars.top.dia / 2;
        return (
          <>
            <Hatch id="hr" ctx={ctx} />
            <rect width={W} height={topping} fill="url(#hr)" stroke={C.line} strokeWidth={sw(ctx, 2)} />
            {ribs.map((x) => (
              <rect key={x} x={x - ribWidth / 2} y={topping} width={ribWidth} height={depth - topping} fill="url(#hr)" stroke={C.line} strokeWidth={sw(ctx, 2)} />
            ))}
            {[0, 1].map((k) => (
              <g key={k}>
                <rect x={ribWidth + k * ribSpacing} y={topping} width={ribSpacing - ribWidth} height={depth - topping} fill="#15130f" stroke={C.mute} strokeWidth={sw(ctx, 1)} />
                <line x1={ribWidth + k * ribSpacing} y1={topping} x2={ribSpacing + k * ribSpacing} y2={depth} stroke={C.mute} strokeWidth={sw(ctx, 0.8)} />
                <line x1={ribSpacing + k * ribSpacing} y1={topping} x2={ribWidth + k * ribSpacing} y2={depth} stroke={C.mute} strokeWidth={sw(ctx, 0.8)} />
              </g>
            ))}
            {ribs.map((x) => (
              <g key={`s${x}`}>
                <rect x={x - ribWidth / 2 + cover + ribLinks.dia / 2} y={cover + ribLinks.dia / 2} width={ribWidth - 2 * cover - ribLinks.dia} height={depth - 2 * cover - ribLinks.dia} fill="none" stroke={C.steel} strokeWidth={ribLinks.dia} />
                {bar(ribBars.top.n, ribBars.top.dia, x, yt)}
                {bar(ribBars.bottom.n, ribBars.bottom.dia, x, yb)}
              </g>
            ))}
            <Dim ctx={ctx} x1={ribWidth / 2} y1={depth} x2={ribWidth / 2 + ribSpacing} y2={depth} off={ctx.u * 0.07} text={`${ribSpacing} c/c`} />
            <Dim ctx={ctx} x1={W} y1={0} x2={W} y2={depth} off={ctx.u * 0.05} text={`${depth}`} vertical />
            <Dim ctx={ctx} x1={0} y1={0} x2={0} y2={topping} off={-ctx.u * 0.06} text={`${topping}`} vertical />
            <Callout ctx={ctx} x={ribs[0]} y={yb} tx={-ctx.u * 0.06} ty={depth + ctx.u * 0.12} text={`${ribBars.bottom.n} T${ribBars.bottom.dia} B · rib ${ribWidth}`} />
            <Callout ctx={ctx} x={ribs[1]} y={yt} tx={ribs[1]} ty={-ctx.u * 0.06} text={`${ribBars.top.n} T${ribBars.top.dia} T · T${ribLinks.dia}@${ribLinks.spacing}`} />
            <text x={ribWidth + ribSpacing / 2 - ribWidth / 2} y={(topping + depth) / 2} fill={C.mute} fontSize={fs(ctx) * 0.8} fontFamily="JetBrains Mono, monospace" textAnchor="middle" dominantBaseline="middle">
              block
            </text>
          </>
        );
      }, 0.18);
    }

    case 'rc-footing': {
      const { l, t, cover, bottom } = section;
      return frame(l, t, (ctx) => {
        const n = Math.floor(l / bottom.spacing);
        const y = t - cover - bottom.dia / 2;
        const colW = Math.min(600, l * 0.25);
        return (
          <>
            <Hatch id="hf" ctx={ctx} />
            <rect x={(l - colW) / 2} y={-t * 0.6} width={colW} height={t * 0.6} fill="none" stroke={C.mute} strokeWidth={sw(ctx, 1.4)} strokeDasharray={`${sw(ctx, 8)} ${sw(ctx, 5)}`} />
            <rect width={l} height={t} fill="url(#hf)" stroke={C.line} strokeWidth={sw(ctx, 2)} />
            <line x1={cover} x2={l - cover} y1={y - bottom.dia} y2={y - bottom.dia} stroke={C.steel} strokeWidth={bottom.dia * 0.8} />
            {Array.from({ length: n }, (_, i) => (
              <circle key={i} cx={(l - (n - 1) * bottom.spacing) / 2 + i * bottom.spacing} cy={y} r={bottom.dia / 2} fill={C.steel} />
            ))}
            <Dim ctx={ctx} x1={0} y1={t} x2={l} y2={t} off={ctx.u * 0.08} text={`${l}`} />
            <Dim ctx={ctx} x1={l} y1={0} x2={l} y2={t} off={ctx.u * 0.05} text={`${t}`} vertical />
            <Callout ctx={ctx} x={(l - (n - 1) * bottom.spacing) / 2} y={y} tx={-ctx.u * 0.05} ty={t + ctx.u * 0.05} text={`T${bottom.dia}@${bottom.spacing} EW`} />
          </>
        );
      }, 0.25);
    }

    case 'masonry-wall': {
      const H = 1200;
      const { t } = section;
      return frame(t, H, (ctx) => {
        const courses = 5;
        const ch = H / courses;
        return (
          <>
            <rect width={t} height={H} fill={C.stone} stroke={C.line} strokeWidth={sw(ctx, 2)} />
            {Array.from({ length: courses - 1 }, (_, i) => (
              <line key={i} x1={0} x2={t} y1={(i + 1) * ch} y2={(i + 1) * ch} stroke={C.mute} strokeWidth={sw(ctx, 1.2)} />
            ))}
            {Array.from({ length: courses }, (_, i) => (
              <line key={`v${i}`} x1={i % 2 ? t * 0.38 : t * 0.62} x2={i % 2 ? t * 0.38 : t * 0.62} y1={i * ch} y2={(i + 1) * ch} stroke={C.mute} strokeWidth={sw(ctx, 1.2)} />
            ))}
            <line x1={0} x2={t} y1={ch * 2.5} y2={ch * 2.5} stroke={C.steel} strokeWidth={sw(ctx, 4)} />
            <Callout ctx={ctx} x={t / 2} y={ch * 2.5} tx={t + ctx.u * 0.12} ty={ch * 2.2} text="timber tie" />
            <Dim ctx={ctx} x1={0} y1={H} x2={t} y2={H} off={ctx.u * 0.08} text={`${t}`} />
          </>
        );
      }, 0.3);
    }

    case 'timber-beam': {
      const { b, h } = section;
      return frame(b, h, (ctx) => (
        <>
          <rect width={b} height={h} fill={C.timber} stroke={C.line} strokeWidth={sw(ctx, 2)} />
          {[0.25, 0.45, 0.65, 0.85].map((k) => (
            <ellipse key={k} cx={b * 0.2} cy={h * 1.05} rx={b * k} ry={h * k * 0.9} fill="none" stroke="#6b4f35" strokeWidth={sw(ctx, 1.2)} />
          ))}
          <Dim ctx={ctx} x1={0} y1={h} x2={b} y2={h} off={ctx.u * 0.12} text={`${b}`} />
          <Dim ctx={ctx} x1={b} y1={0} x2={b} y2={h} off={ctx.u * 0.12} text={`${h}`} vertical />
        </>
      ));
    }

    case 'layered': {
      const W = 1000;
      const total = section.layers.reduce((a, l) => a + l.t, 0);
      return frame(W, total, (ctx) => {
        let y = 0;
        const fills = ['#3a3835', '#2b2620', '#4a3826', '#5b4430'];
        return (
          <>
            {section.layers.map((l, i) => {
              const y0 = y;
              y += l.t;
              return (
                <g key={l.name}>
                  <rect y={y0} width={W} height={l.t} fill={fills[i % fills.length]} stroke={C.line} strokeWidth={sw(ctx, 1.2)} />
                  <text
                    x={W + ctx.u * 0.04}
                    y={y0 + l.t / 2}
                    fill={C.line}
                    fontSize={Math.min(fs(ctx) * 0.8, 46)}
                    fontFamily="JetBrains Mono, monospace"
                    dominantBaseline="middle"
                  >
                    {l.t} · {l.name}
                  </text>
                </g>
              );
            })}
            <Dim ctx={ctx} x1={0} y1={0} x2={0} y2={total} off={-ctx.u * 0.06} text={`${total}`} vertical />
          </>
        );
      }, 0.5);
    }

    case 'steel-tube': {
      const { od, t } = section;
      const r = od / 2;
      return frame(od, od, (ctx) => (
        <>
          <circle cx={r} cy={r} r={r - t / 2} fill="none" stroke={C.steel} strokeWidth={t} />
          <circle cx={r} cy={r} r={r} fill="none" stroke={C.line} strokeWidth={sw(ctx, 1)} />
          <Dim ctx={ctx} x1={0} y1={od} x2={od} y2={od} off={ctx.u * 0.14} text={`Ø${od}`} />
          <Callout ctx={ctx} x={od - t / 2} y={r} tx={od + ctx.u * 0.2} ty={r * 0.4} text={`t ${t}`} />
        </>
      ));
    }
  }
}
