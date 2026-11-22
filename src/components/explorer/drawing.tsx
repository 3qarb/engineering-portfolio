import { C, fs, sw, type Ctx } from './drawingKit';

export function Dim({
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

export function Callout({ ctx, x, y, tx, ty, text }: { ctx: Ctx; x: number; y: number; tx: number; ty: number; text: string }) {
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

export function Hatch({ id, ctx }: { id: string; ctx: Ctx }) {
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

