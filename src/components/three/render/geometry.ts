import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { StructuralElement } from '../../../lib/structure/types';

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
  return `${isTube(el) ? 't' : 'b'}${x}x${y}x${z}`;
}

/** Bevelled box (or tube) sized to the member, shared by every member of that size. */
export function memberGeometry(el: StructuralElement): THREE.BufferGeometry {
  const key = geometryKey(el);
  let g = geoCache.get(key);
  if (g) return g;
  const [sx, sy, sz] = el.size;
  if (isTube(el)) {
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
