import { useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/** Frames a w×d×h structure at the origin in a three-quarter view; flags readiness after some frames. */
export function Framer({ w, d, h, onReady }: { w: number; d: number; h: number; onReady?: () => void }) {
  const { camera, size } = useThree();
  const [frames, setFrames] = useState(0);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const r = Math.hypot(w, d, h) / 2;
    const fov = THREE.MathUtils.degToRad(cam.fov ?? 30);
    const aspect = size.width / Math.max(1, size.height);
    const fit = Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * aspect));
    const dist = (r / Math.sin(fit / 2)) * 1.02;
    const dir = new THREE.Vector3(1, 0.72, 1.1).normalize();
    camera.position.copy(dir.multiplyScalar(dist)).add(new THREE.Vector3(0, h * 0.45, 0));
    camera.lookAt(0, h * 0.42, 0);
  }, [camera, size, w, d, h]);

  useFrame(() => {
    if (frames < 40) setFrames((f) => f + 1);
    else if (frames === 40) {
      setFrames(41);
      onReady?.();
    }
  });
  return null;
}
