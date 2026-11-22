import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { cageFor } from '../../lib/structure/rebar';
import type { StructuralElement } from '../../lib/structure/types';
import { rebarMaterial } from './render/materials';

const unitBar = new THREE.CylinderGeometry(1, 1, 1, 10, 1);
const UP = new THREE.Vector3(0, 1, 0);
const noRaycast = () => null;

/** A closed tie / stirrup: rounded rectangle swept with the bar diameter, in the XY plane. */
function loopGeometry(w: number, h: number, dia: number) {
  const r = Math.min(dia * 2.5, w / 4, h / 4);
  const pts: THREE.Vector3[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let k = 0; k <= 4; k++) {
      const a = a0 + (k / 4) * (Math.PI / 2);
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0));
    }
  };
  corner(w / 2 - r, h / 2 - r, 0);
  corner(-w / 2 + r, h / 2 - r, Math.PI / 2);
  corner(-w / 2 + r, -h / 2 + r, Math.PI);
  corner(w / 2 - r, -h / 2 + r, (3 * Math.PI) / 2);
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.05);
  return new THREE.TubeGeometry(curve, 48, dia / 2, 6, true);
}

/** Reinforcement of one member, drawn in its local frame at its true position. */
export function RebarCage({ el }: { el: StructuralElement }) {
  const cage = useMemo(() => cageFor(el), [el]);
  const bars = useRef<THREE.InstancedMesh>(null);
  const loops = useRef<THREE.InstancedMesh>(null);
  const loop0 = cage?.loops[0];
  const loopGeo = useMemo(
    () => (loop0 ? (loop0.round ? new THREE.TorusGeometry(loop0.w / 2, loop0.dia / 2, 6, 40) : loopGeometry(loop0.w, loop0.h, loop0.dia)) : null),
    [loop0],
  );

  useLayoutEffect(() => {
    if (!cage) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const mid = new THREE.Vector3();
    cage.bars.forEach((bar, i) => {
      a.set(...bar.from);
      b.set(...bar.to);
      const dir = b.clone().sub(a);
      const len = dir.length();
      q.setFromUnitVectors(UP, dir.normalize());
      mid.addVectors(a, b).multiplyScalar(0.5);
      m.compose(mid, q, new THREE.Vector3(bar.dia / 2, len, bar.dia / 2));
      bars.current?.setMatrixAt(i, m);
    });
    if (bars.current) bars.current.instanceMatrix.needsUpdate = true;

    const rot = new THREE.Euler();
    cage.loops.forEach((lp, i) => {
      if (lp.axis === 'y') rot.set(-Math.PI / 2, 0, 0);
      else if (lp.axis === 'x') rot.set(0, Math.PI / 2, 0);
      else rot.set(0, 0, 0);
      m.compose(new THREE.Vector3(...lp.center), q.setFromEuler(rot), new THREE.Vector3(1, 1, 1));
      loops.current?.setMatrixAt(i, m);
    });
    if (loops.current) loops.current.instanceMatrix.needsUpdate = true;
  }, [cage]);

  if (!cage) return null;
  return (
    <group position={el.position} rotation={el.rotation}>
      <instancedMesh ref={bars} args={[unitBar, rebarMaterial, cage.bars.length]} castShadow frustumCulled={false} raycast={noRaycast} />
      {loopGeo && (
        <instancedMesh ref={loops} args={[loopGeo, rebarMaterial, cage.loops.length]} castShadow frustumCulled={false} raycast={noRaycast} />
      )}
    </group>
  );
}
