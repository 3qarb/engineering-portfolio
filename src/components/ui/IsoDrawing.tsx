import { useMemo } from 'react';
import { motion } from 'motion/react';
import { elementsFor } from '../../lib/structure/generate';
import type { BuildingSpec } from '../../lib/structure/types';
import { cn } from '../../utils/cn';

const C30 = Math.cos(Math.PI / 6);
const S30 = Math.sin(Math.PI / 6);
const iso = (x: number, y: number, z: number): [number, number] => [(x - z) * C30, (x + z) * S30 - y];

/** Isometric line drawing of a structure, generated from the same model as the 3D explorer. */
export function IsoDrawing({
  spec,
  className,
  animate = true,
}: {
  spec: BuildingSpec;
  className?: string;
  animate?: boolean;
}) {
  const { members, plates, box } = useMemo(() => {
    let m = '';
    let p = '';
    const bb = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    const seg = (a: [number, number, number], b: [number, number, number]) => {
      const [x1, y1] = iso(...a);
      const [x2, y2] = iso(...b);
      bb.minX = Math.min(bb.minX, x1, x2);
      bb.maxX = Math.max(bb.maxX, x1, x2);
      bb.minY = Math.min(bb.minY, y1, y2);
      bb.maxY = Math.max(bb.maxY, y1, y2);
      return `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`;
    };
    const rect = (pts: [number, number, number][]) =>
      pts.map((pt, i) => seg(pt, pts[(i + 1) % pts.length])).join('');

    for (const el of elementsFor(spec)) {
      const [cx, cy, cz] = el.position;
      const [sx, sy, sz] = el.size;
      if (el.kind === 'slab') {
        const y = cy + sy / 2;
        p += rect([
          [cx - sx / 2, y, cz - sz / 2],
          [cx + sx / 2, y, cz - sz / 2],
          [cx + sx / 2, y, cz + sz / 2],
          [cx - sx / 2, y, cz + sz / 2],
        ]);
      } else if (el.kind === 'wall') {
        const alongX = sx >= sz;
        const h = sy / 2;
        const l = (alongX ? sx : sz) / 2;
        const pts: [number, number, number][] = alongX
          ? [
              [cx - l, cy - h, cz],
              [cx + l, cy - h, cz],
              [cx + l, cy + h, cz],
              [cx - l, cy + h, cz],
            ]
          : [
              [cx, cy - h, cz - l],
              [cx, cy - h, cz + l],
              [cx, cy + h, cz + l],
              [cx, cy + h, cz - l],
            ];
        m += rect(pts);
      } else if (el.kind !== 'footing') {
        const r = el.rotation?.[2] ?? 0;
        if (sy >= sx && sy >= sz) m += seg([cx, cy - sy / 2, cz], [cx, cy + sy / 2, cz]);
        else if (sx >= sz) {
          const dx = (Math.cos(r) * sx) / 2;
          const dy = (Math.sin(r) * sx) / 2;
          m += seg([cx - dx, cy - dy, cz], [cx + dx, cy + dy, cz]);
        } else m += seg([cx, cy, cz - sz / 2], [cx, cy, cz + sz / 2]);
      }
    }
    const { minX, minY, maxX, maxY } = bb;
    const pad = (maxX - minX) * 0.06;
    return {
      members: m,
      plates: p,
      box: `${(minX - pad).toFixed(1)} ${(minY - pad).toFixed(1)} ${(maxX - minX + pad * 2).toFixed(1)} ${(maxY - minY + pad * 2).toFixed(1)}`,
    };
  }, [spec]);

  const draw = animate
    ? {
        initial: { pathLength: 0 },
        whileInView: { pathLength: 1 },
        viewport: { once: true, margin: '-10%' },
        transition: { duration: 2.2, ease: [0.65, 0, 0.35, 1] as const },
      }
    : {};

  return (
    <svg viewBox={box} className={cn('h-full w-full', className)} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <motion.path
        d={plates}
        fill="none"
        stroke="#c9a46c"
        strokeOpacity={0.5}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        {...draw}
      />
      <motion.path
        d={members}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        className="transition-colors duration-500"
        {...draw}
      />
    </svg>
  );
}
