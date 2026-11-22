import { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { StructuralElement } from '../../lib/structure/types';
import { MemberDetail } from '../three/MemberDetail';
import { Stage } from '../three/Stage';

/** Leaves out the blocks on one side of a ribbed panel so the rib bars show. */
const cutAway = (x: number, z: number) => x + z > 0;

/** Axis-aligned extent of the member, rotation included. */
function extent(el: StructuralElement) {
  const box = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(...el.size));
  box.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...(el.rotation ?? [0, 0, 0]))));
  const s = box.getSize(new THREE.Vector3());
  return { w: s.x, h: s.y, d: s.z };
}

function Fit({ el, center }: { el: StructuralElement; center: THREE.Vector3 }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const { w, h, d } = extent(el);
    const cam = camera as THREE.PerspectiveCamera;
    const r = Math.hypot(w, d, h) / 2;
    const fov = THREE.MathUtils.degToRad(cam.fov);
    const aspect = size.width / Math.max(1, size.height);
    const fit = Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * aspect));
    // flat members fill the frame better than their bounding sphere suggests
    const flat = h < 0.3 * Math.max(w, d) ? 0.82 : 1;
    const dist = (r / Math.sin(fit / 2)) * 1.18 * flat;
    const dir = new THREE.Vector3(1.1, 0.75, 1.25).normalize();
    camera.position.copy(center).add(dir.multiplyScalar(dist));
    camera.lookAt(center);
  }, [camera, size, el, center]);
  return null;
}

/**
 * One member, close up: see-through concrete with its reinforcement, hollow blocks cut away.
 * Loaded lazily with the 3D bundle.
 */
export default function ElementViewer({ el, rebar }: { el: StructuralElement; rebar: boolean }) {
  // stand the member on the ground, centred
  const placed = useMemo<StructuralElement>(() => {
    const { h } = extent(el);
    return { ...el, position: [0, h / 2 + (el.section.kind === 'rc-slab' && el.section.drop ? el.section.drop.t / 1000 : 0), 0] };
  }, [el]);
  const center = useMemo(() => new THREE.Vector3(0, extent(el).h / 2, 0), [el]);
  const r = Math.max(...Object.values(extent(el)));
  return (
    <Canvas shadows camera={{ fov: 30, near: 0.05, far: 200 }} dpr={[1, 1.75]} gl={{ antialias: false }} frameloop="demand" onCreated={({ gl }) => (gl.localClippingEnabled = true)}>
      <Fit el={placed} center={center} />
      <Stage center={[0, 0]} radius={Math.max(2, r)} sunHour={10} grid={false} background="#0c0c0d" />
      <MemberDetail el={placed} rebar={rebar} keepFiller={cutAway} />
      <OrbitControls target={center} enableDamping makeDefault minDistance={r * 0.4} maxDistance={r * 6} />
    </Canvas>
  );
}
