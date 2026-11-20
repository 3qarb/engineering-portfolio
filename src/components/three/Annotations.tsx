import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BuildingSpec } from '../../lib/structure/types';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const noRaycast = () => null;
const texCache = new Map<string, THREE.CanvasTexture>();

/** Annotation text painted on a canvas: a grid bubble or a level head. */
function labelTexture(text: string, kind: 'bubble' | 'level') {
  const key = `${kind}:${text}`;
  const hit = texCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  if (kind === 'bubble') {
    c.width = c.height = 128;
    ctx.strokeStyle = '#ece7df';
    ctx.lineWidth = 6;
    ctx.fillStyle = 'rgba(12,12,13,0.85)';
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ece7df';
    ctx.font = '600 64px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 68);
  } else {
    c.width = 512;
    c.height = 96;
    ctx.fillStyle = '#c9a46c';
    ctx.beginPath();
    ctx.moveTo(8, 30);
    ctx.lineTo(40, 30);
    ctx.lineTo(24, 58);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(8, 60, 496, 3);
    ctx.fillStyle = '#ece7df';
    ctx.font = '500 34px "JetBrains Mono", monospace';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, 56, 50);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

function Sprite({ text, kind, position, scale }: { text: string; kind: 'bubble' | 'level'; position: [number, number, number]; scale: [number, number] }) {
  const mat = useMemo(
    () => new THREE.SpriteMaterial({ map: labelTexture(text, kind), depthTest: false, toneMapped: false, transparent: true }),
    [text, kind],
  );
  return <sprite material={mat} position={position} scale={[scale[0], scale[1], 1]} renderOrder={10} raycast={noRaycast} />;
}

const cum = (bays: number[]) => bays.reduce<number[]>((a, b) => [...a, a[a.length - 1] + b], [0]);

/** Revit-style grid bubbles on the ground and level heads that follow exploded storeys. */
export function Annotations({ spec, offsets }: { spec: BuildingSpec; offsets: MutableRefObject<Map<number, number>> }) {
  const xs = useMemo(() => {
    const c = cum(spec.baysX);
    const w = c[c.length - 1];
    return c.map((x) => x - w / 2);
  }, [spec.baysX]);
  const zs = useMemo(() => {
    const c = cum(spec.baysZ);
    const d = c[c.length - 1];
    return c.map((z) => z - d / 2);
  }, [spec.baysZ]);
  const x0 = xs[0];
  const x1 = xs[xs.length - 1];
  const z0 = zs[0];
  const z1 = zs[zs.length - 1];
  const reach = 2.4;

  const gridLines = useMemo(() => {
    const pts: number[] = [];
    for (const x of xs) pts.push(x, 0.02, z0 - 1, x, 0.02, z1 + reach - 0.5);
    for (const z of zs) pts.push(x0 - 1, 0.02, z, x1 + reach - 0.5, 0.02, z);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [xs, zs, x0, x1, z0, z1]);

  const lineMat = useMemo(
    () => new THREE.LineDashedMaterial({ color: '#c9a46c', dashSize: 0.6, gapSize: 0.35, transparent: true, opacity: 0.7, depthTest: false }),
    [],
  );
  const heads = useRef<(THREE.Group | null)[]>([]);

  useFrame(() => {
    for (let L = 0; L < spec.floors; L++) {
      const g = heads.current[L];
      if (g) g.position.y = (L + 1) * spec.storeyHeight + (offsets.current.get(L) ?? 0);
    }
  });

  return (
    <group>
      <lineSegments
        geometry={gridLines}
        material={lineMat}
        onUpdate={(l) => l.computeLineDistances()}
        renderOrder={9}
        raycast={noRaycast}
      />
      {xs.map((x, i) => (
        <Sprite key={`gx${i}`} text={LETTERS[i]} kind="bubble" position={[x, 0.05, z1 + reach]} scale={[1.3, 1.3]} />
      ))}
      {zs.map((z, j) => (
        <Sprite key={`gz${j}`} text={String(j + 1)} kind="bubble" position={[x1 + reach, 0.05, z]} scale={[1.3, 1.3]} />
      ))}
      <Sprite text="Ground  ±0.00" kind="level" position={[x0 - 4.6, 0.45, z1 + 0.6]} scale={[7.4, 1.4]} />
      {Array.from({ length: spec.floors }, (_, L) => (
        <group key={L} ref={(g) => {
            heads.current[L] = g;
          }}>
          <Sprite
            text={`L${String(L + 1).padStart(2, '0')}  +${((L + 1) * spec.storeyHeight).toFixed(2)}`}
            kind="level"
            position={[x0 - 4.6, 0.45, z1 + 0.6]}
            scale={[7.4, 1.4]}
          />
        </group>
      ))}
    </group>
  );
}
