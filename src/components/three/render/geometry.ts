import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { StructuralElement } from '../../../lib/structure/types';
import { ribCentres, stairProfile } from '../../../lib/structure/rebar';

/** Real tubes are 48.3 mm; drawn a little heavier so they read at site scale. */
export const TUBE_R = 0.032;

const geoCache = new Map<string, THREE.BufferGeometry>();

/** UVs in metres, projected along each face's dominant normal (so textures keep real scale). */
function boxProjectUV(g: THREE.BufferGeometry) {
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    if (ax >= ay && ax >= az) {
      uv[i * 2] = z;
      uv[i * 2 + 1] = y;
    } else if (ay >= az) {
      uv[i * 2] = x;
      uv[i * 2 + 1] = z;
    } else {
      uv[i * 2] = x;
      uv[i * 2 + 1] = y;
    }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

export const isTube = (el: StructuralElement) => el.section.kind === 'steel-tube';

export function geometryKey(el: StructuralElement) {
  const [x, y, z] = el.size.map((v) => Math.round(v * 1000));
  const s = el.section;
  const tag = isTube(el) ? 't' : s.kind === 'stair' ? `s${s.steps}-` : 'b';
  return `${tag}${x}x${y}x${z}`;
}

/** Stepped flight: the stair profile extruded across its width (z). */
function stairGeometry(el: StructuralElement & { section: Extract<StructuralElement['section'], { kind: 'stair' }> }) {
  const { pts } = stairProfile(el.section, el.size);
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: el.size[2], bevelEnabled: false });
  g.translate(0, 0, -el.size[2] / 2);
  boxProjectUV(g);
  return g;
}

/** Bevelled box (or tube) sized to the member, shared by every member of that size. */
export function memberGeometry(el: StructuralElement): THREE.BufferGeometry {
  const key = geometryKey(el);
  let g = geoCache.get(key);
  if (g) return g;
  const [sx, sy, sz] = el.size;
  if (el.section.kind === 'stair') {
    g = stairGeometry(el as Parameters<typeof stairGeometry>[0]);
  } else if (isTube(el)) {
    const len = Math.max(sx, sy, sz);
    g = new THREE.CylinderGeometry(TUBE_R, TUBE_R, len, 12, 1);
    if (sx >= sy && sx >= sz) g.rotateZ(Math.PI / 2);
    else if (sz >= sy) g.rotateX(Math.PI / 2);
  } else {
    // concrete gets a small arris; masonry and timber meet flush
    const r = el.kind === 'wall' || el.section.kind === 'timber-beam' ? 0.002 : Math.min(0.018, Math.min(sx, sy, sz) * 0.12);
    g = new RoundedBoxGeometry(sx, sy, sz, 2, r);
    boxProjectUV(g);
  }
  geoCache.set(key, g);
  return g;
}

const box = (w: number, h: number, d: number, x: number, y: number, z: number) => {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
};

/**
 * The member as built, for close-up views: ribbed slabs as topping + ribs, flat slabs with their
 * drop panel. Anything else is the plain member geometry.
 */
export function detailGeometry(el: StructuralElement): THREE.BufferGeometry {
  const s = el.section;
  const [sx, sy, sz] = el.size;
  if (s.kind === 'ribbed-slab') {
    const key = `rib|${geometryKey(el)}|${s.ribAxis}|${s.ribWidth}|${s.ribSpacing}|${s.topping}`;
    const hit = geoCache.get(key);
    if (hit) return hit;
    const top = s.topping / 1000;
    const stem = sy - top;
    const bw = s.ribWidth / 1000;
    const parts = [box(sx, top, sz, 0, sy / 2 - top / 2, 0)];
    const yc = -sy / 2 + stem / 2;
    if (s.ribAxis !== 'z') for (const z of ribCentres(sz, s.ribSpacing / 1000)) parts.push(box(sx, stem, bw, 0, yc, z));
    if (s.ribAxis !== 'x') for (const x of ribCentres(sx, s.ribSpacing / 1000)) parts.push(box(bw, stem, sz, x, yc, 0));
    const g = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
    boxProjectUV(g);
    geoCache.set(key, g);
    return g;
  }
  if (s.kind === 'rc-slab' && s.drop) {
    const d = s.drop.size / 1000;
    const t = s.drop.t / 1000;
    const g = mergeGeometries([box(sx, sy, sz, 0, 0, 0), box(d, t, d, 0, -sy / 2 - t / 2, 0)].map((p) => p.toNonIndexed()))!;
    boxProjectUV(g);
    return g;
  }
  return memberGeometry(el);
}

/**
 * Hollow blocks (or void formers) between the ribs, as boxes in the slab's local frame. `keep`
 * decides which blocks to draw, so a view can leave some out to show the bars.
 */
export function fillerBoxes(el: StructuralElement, keep: (x: number, z: number) => boolean = () => true) {
  const s = el.section;
  if (s.kind !== 'ribbed-slab') return [];
  const [sx, sy, sz] = el.size;
  const sp = s.ribSpacing / 1000;
  const bw = s.ribWidth / 1000;
  const stem = sy - s.topping / 1000;
  const gap = 0.006;
  const y = -sy / 2 + stem / 2;
  const out: { position: [number, number, number]; size: [number, number, number] }[] = [];
  const zs = ribCentres(sz, sp);
  const xs = ribCentres(sx, sp);
  if (s.ribAxis === 'both') {
    for (let i = 0; i < xs.length - 1; i++)
      for (let k = 0; k < zs.length - 1; k++) {
        const x = (xs[i] + xs[i + 1]) / 2;
        const z = (zs[k] + zs[k + 1]) / 2;
        if (keep(x, z)) out.push({ position: [x, y, z], size: [sp - bw - gap, stem - gap, sp - bw - gap] });
      }
    return out;
  }
  // one-way: blocks are laid in a row between each pair of ribs, 400 mm long
  const along = s.ribAxis === 'x' ? sx : sz;
  const ribs = s.ribAxis === 'x' ? zs : xs;
  const len = 0.4;
  const n = Math.max(1, Math.floor(along / len));
  for (let i = 0; i < ribs.length - 1; i++) {
    const c = (ribs[i] + ribs[i + 1]) / 2;
    for (let j = 0; j < n; j++) {
      const a = -along / 2 + (along - n * len) / 2 + len * (j + 0.5);
      const [x, z] = s.ribAxis === 'x' ? [a, c] : [c, a];
      if (!keep(x, z)) continue;
      const size: [number, number, number] = s.ribAxis === 'x' ? [len - gap, stem - gap, sp - bw - gap] : [sp - bw - gap, stem - gap, len - gap];
      out.push({ position: [x, y, z], size });
    }
  }
  return out;
}

/** The 12 edges of a box of the given size, as local corner pairs. */
export function boxEdgeCorners(sx: number, sy: number, sz: number): number[] {
  const x = sx / 2;
  const y = sy / 2;
  const z = sz / 2;
  const c = [
    [-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z],
    [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z],
  ];
  const e = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
  return e.flatMap((i) => c[i]);
}
