import { useMemo } from 'react';
import { Environment, Grid, Lightformer } from '@react-three/drei';
import { EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';

/**
 * Lighting rig for every 3D view.
 * - Environment (softboxes) carries most of the light, so concrete, stone and steel separate by response.
 * - One sun: its job is the cast shadow that grounds the model; the hour moves it east → west.
 * - N8AO adds the contact darkening a BIM render gets from ambient occlusion.
 */
export function Stage({
  center = [0, 0],
  radius = 30,
  sunHour = 10,
  realistic = true,
  grid = true,
  ao = true,
  background = '#0c0c0d',
}: {
  center?: [number, number];
  radius?: number;
  sunHour?: number;
  realistic?: boolean;
  grid?: boolean;
  ao?: boolean;
  background?: string;
}) {
  const target = useMemo(() => new THREE.Object3D(), []);
  const t = THREE.MathUtils.clamp((sunHour - 6) / 12, 0, 1);
  const elev = THREE.MathUtils.degToRad(14 + 58 * Math.sin(Math.PI * t));
  const az = Math.PI * (0.08 + 0.84 * t); // east (+x) through south (+z) to west (−x)
  const R = radius * 3 + 30;
  const sun: [number, number, number] = [
    center[0] + Math.cos(az) * Math.cos(elev) * R,
    Math.sin(elev) * R,
    center[1] + Math.sin(az) * Math.cos(elev) * R,
  ];
  target.position.set(center[0], 0, center[1]);
  const half = radius * 1.25;
  const warm = 1 - Math.abs(t - 0.5) * 2; // low sun is warmer

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, radius * 3.2, radius * 7]} />
      <Environment resolution={256} frames={1} environmentIntensity={realistic ? 0.48 : 0.9}>
        <Lightformer form="rect" intensity={2.6} color="#fff3e2" position={[0, 9, 12]} scale={[34, 9, 1]} />
        <Lightformer form="rect" intensity={1.3} color="#dce6f0" position={[-14, 7, -6]} rotation-y={Math.PI / 2} scale={[24, 7, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[14, 12, -8]} rotation-y={-Math.PI / 2} scale={[18, 6, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#2a2622" position={[0, -6, 0]} rotation-x={Math.PI / 2} scale={[60, 60, 1]} />
      </Environment>
      <hemisphereLight args={['#f6efe4', '#18171a', realistic ? 0.25 : 0.8]} />
      <primitive object={target} />
      <directionalLight
        position={sun}
        target={target}
        color={new THREE.Color('#fff1dd').lerp(new THREE.Color('#ffd2a1'), 1 - warm)}
        intensity={realistic ? 3.1 : 1.2}
        castShadow={realistic}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-half}
        shadow-camera-right={half}
        shadow-camera-top={half}
        shadow-camera-bottom={-half}
        shadow-camera-near={1}
        shadow-camera-far={R + radius * 3}
      />
      {/* ground that only shows the shadow, so footings below grade stay visible */}
      <mesh rotation-x={-Math.PI / 2} position={[center[0], 0.001, center[1]]} receiveShadow>
        <planeGeometry args={[radius * 8, radius * 8]} />
        <shadowMaterial transparent opacity={0.55} color="#000000" />
      </mesh>
      {grid && (
        <Grid
          args={[400, 400]}
          position={[0, -0.002, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#1b1b1c"
          sectionSize={6}
          sectionThickness={0.9}
          sectionColor="#2a2927"
          fadeDistance={radius * 5}
          fadeStrength={1.4}
          infiniteGrid
        />
      )}
      {ao ? (
        <EffectComposer multisampling={0}>
          <N8AO halfRes aoRadius={1.6} distanceFalloff={0.6} intensity={realistic ? 2.6 : 1.4} quality="medium" />
          <SMAA />
          <ToneMapping mode={ToneMappingMode.AGX} />
          <Vignette offset={0.4} darkness={0.32} />
        </EffectComposer>
      ) : null}
    </>
  );
}
