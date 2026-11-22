import type { ReactNode } from 'react';

/* Drawing colours, kept in sync with the theme tokens */
export const C = {
  line: '#ece7df',
  mute: '#8a857d',
  steel: '#c9a46c',
  concrete: '#1d1c1b',
  hatch: '#3a3835',
  stone: '#2b2620',
  timber: '#3a2a1b',
};

export interface Ctx {
  /** reference size (mm) used to scale strokes and text */
  u: number;
}

export const sw = (ctx: Ctx, k = 1) => (ctx.u / 420) * k;
export const fs = (ctx: Ctx) => ctx.u * 0.05;


export function frame(w: number, h: number, children: (ctx: Ctx) => ReactNode, pad = 0.55) {
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
