import * as THREE from 'three';
import type { StructuralElement } from '../../../lib/structure/types';
import type { VisualStyle } from '../../../store/explorerStore';
import { textures } from './textures';

export type MatKey = 'concrete' | 'footing' | 'stone' | 'timber' | 'screed' | 'steel' | 'board' | 'roshan';

export function materialKey(el: StructuralElement): MatKey {
  const s = el.section;
  if (s.kind === 'timber-beam') return 'timber';
  if (el.label.startsWith('Roshan crown') || el.label.startsWith('Roshan base')) return 'timber';
  if (s.kind === 'masonry-wall') return 'stone';
  if (s.kind === 'steel-tube') return 'steel';
  if (s.kind === 'rc-footing') return 'footing';
  if (s.kind === 'layered') return s.layers.length === 1 ? 'board' : s.layers[0].name.includes('mashrabiya') ? 'roshan' : 'screed';
  return 'concrete';
}

/** Section-box cut, shared by every structural material. */
export const cutPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000);
const planes = [cutPlane];

type Set = Record<MatKey, THREE.Material>;
const sets = new Map<VisualStyle, Set>();

function realistic(): Set {
  const t = textures();
  return {
    concrete: new THREE.MeshStandardMaterial({ ...t.concrete, roughness: 0.92, metalness: 0 }),
    footing: new THREE.MeshStandardMaterial({ ...t.footing, roughness: 0.95 }),
    stone: new THREE.MeshStandardMaterial({ ...t.stone, roughness: 0.97 }),
    timber: new THREE.MeshStandardMaterial({ ...t.timber, roughness: 0.72 }),
    screed: new THREE.MeshStandardMaterial({ ...t.screed, roughness: 0.9 }),
    steel: new THREE.MeshStandardMaterial({ color: '#b4babe', roughness: 0.32, metalness: 0.9 }),
    board: new THREE.MeshStandardMaterial({ color: '#8e959a', roughness: 0.45, metalness: 0.75 }),
    roshan: new THREE.MeshStandardMaterial({ ...t.lattice, roughness: 0.7 }),
  };
}

/** Revit "Shaded": flat category colours. */
function shaded(): Set {
  const m = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 });
  return {
    concrete: m('#b9b9b9'),
    footing: m('#8c8c8c'),
    stone: m('#c9b38e'),
    timber: m('#9a6b43'),
    screed: m('#cfc8b9'),
    steel: m('#7d97b0'),
    board: m('#6f8193'),
    roshan: m('#7a5236'),
  };
}

/** Revit "Hidden line": white faces, edges drawn separately. */
function hidden(): Set {
  const m = new THREE.MeshBasicMaterial({ color: '#f1efea', polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  return { concrete: m, footing: m, stone: m, timber: m, screed: m, steel: m, board: m, roshan: m };
}

export function materialSet(style: VisualStyle): Set {
  let s = sets.get(style);
  if (!s) {
    s = style === 'realistic' ? realistic() : style === 'shaded' ? shaded() : hidden();
    for (const mat of Object.values(s)) mat.clippingPlanes = planes;
    sets.set(style, s);
  }
  return s;
}

/** Solid fill seen through a section cut (Revit "cut pattern"). */
export const capMaterial = new THREE.MeshBasicMaterial({
  color: '#c9a46c',
  side: THREE.BackSide,
  clippingPlanes: planes,
});

export const edgeLineMaterial = new THREE.LineBasicMaterial({ color: '#1a1a1a', clippingPlanes: planes });

export const rebarMaterial = new THREE.MeshStandardMaterial({
  color: '#b48f6a',
  roughness: 0.42,
  metalness: 0.55,
  emissive: '#2a1a0c',
  clippingPlanes: planes,
});

/** Concrete made see-through so the cage reads inside it. */
export const glassConcrete = new THREE.MeshStandardMaterial({
  color: '#d9d4cb',
  roughness: 0.4,
  transparent: true,
  opacity: 0.14,
  depthWrite: false,
  clippingPlanes: planes,
});

/** Everything except the selection, while a member is selected (Revit temporary transparency). */
export const ghostMaterial = new THREE.MeshStandardMaterial({
  color: '#d8d2c8',
  transparent: true,
  opacity: 0.07,
  depthWrite: false,
  clippingPlanes: planes,
});
const ghostSet = Object.fromEntries(
  (['concrete', 'footing', 'stone', 'timber', 'screed', 'steel', 'board', 'roshan'] as MatKey[]).map((k) => [k, ghostMaterial]),
) as unknown as Set;
export const ghostMaterials = () => ghostSet;

export const edgeGhostMaterial = new THREE.LineBasicMaterial({ color: '#ece7df', transparent: true, opacity: 0.13, clippingPlanes: planes });
export const selectEdge = new THREE.LineBasicMaterial({ color: '#f3bf62' });

export const glassEdge = new THREE.LineBasicMaterial({ color: '#f0d29a', transparent: true, opacity: 0.9 });
