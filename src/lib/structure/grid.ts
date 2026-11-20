import type { BuildingSpec } from './types';

export const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const letter = (i: number) => LETTERS[i] ?? `X${i}`;

const cumulative = (bays: number[]) =>
  bays.reduce<number[]>((acc, b) => [...acc, acc[acc.length - 1] + b], [0]);


/** Grid line coordinates, centred on the footprint. */
export function grid(spec: BuildingSpec) {
  const xs = cumulative(spec.baysX);
  const zs = cumulative(spec.baysZ);
  const w = xs[xs.length - 1];
  const d = zs[zs.length - 1];
  return {
    xs: xs.map((x) => x - w / 2),
    zs: zs.map((z) => z - d / 2),
    w,
    d,
  };
}
