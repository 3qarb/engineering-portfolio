import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CameraControls, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import type { BuildingSpec } from '../../lib/structure/types';
import { buildingBounds, elementsFor } from '../../lib/structure/generate';
import { planSequence } from '../../lib/structure/sequence';
import { useExplorer } from '../../store/explorerStore';
import { EXPLODE_GAP, StructureModel } from './StructureModel';
import { Stage } from './Stage';
import { cutPlane } from './render/materials';
import { labelEls } from './labels';
import { bridge, VIEWS } from './bridge';
import { QUALITY, useQuality, prefersReducedMotion } from '../../lib/device';

const SITE_VIEW: [number, number, number, number, number, number] = [86, 64, 98, -1, 4, 6];

/** The site view, pulled back on portrait screens so every building stays in frame. */
function siteView(aspect: number): [number, number, number, number, number, number] {
  const k = THREE.MathUtils.clamp(1.15 / aspect, 1, 2.3);
  const [px, py, pz, tx, ty, tz] = SITE_VIEW;
  return [tx + (px - tx) * k, ty + (py - ty) * k, tz + (pz - tz) * k, tx, ty, tz];
}

function CameraRig({ buildings, locked }: { buildings: BuildingSpec[]; locked: boolean }) {
  const ref = useRef<CameraControls>(null);
  const buildingId = useExplorer((s) => s.buildingId);
  const exploded = useExplorer((s) => s.exploded);
  const elementId = useExplorer((s) => s.elementId);
  const lastTouch = useRef(0);
  const still = useRef(prefersReducedMotion());
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));

  useEffect(() => {
    bridge.controls = ref.current;
    return () => {
      bridge.controls = null;
    };
  }, []);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const b = buildings.find((x) => x.id === buildingId);
    if (!b) {
      void c.setLookAt(...siteView(aspect), true);
      return;
    }
    const { w, d, h } = buildingBounds(b);
    const lift = exploded ? (b.floors + 1) * EXPLODE_GAP : 0;
    const box = new THREE.Box3(
      new THREE.Vector3(b.site.x - w / 2 - 1, -1.2, b.site.z - d / 2 - 1),
      new THREE.Vector3(b.site.x + w / 2 + 1, h + lift + 1, b.site.z + d / 2 + 1),
    );
    // a sphere keeps the three-quarter view (fitToBox would snap to a face)
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    sphere.radius *= 1.02;
    void c.rotateTo(VIEWS.home[0], VIEWS.home[1], true);
    void c.fitToSphere(sphere, true);
  }, [buildingId, exploded, buildings, aspect]);

  // zoom to the selected member, keeping the current angle
  useEffect(() => {
    const c = ref.current;
    const b = buildings.find((x) => x.id === buildingId);
    if (!c || !b || !elementId) return;
    const el = elementsFor(b).find((e) => e.id === elementId);
    if (!el) return;
    const lift = useExplorer.getState().exploded ? (el.level + 1) * EXPLODE_GAP : 0;
    const center = new THREE.Vector3(b.site.x + el.position[0], el.position[1] + Math.max(0, lift), b.site.z + el.position[2]);
    void c.rotateTo(c.azimuthAngle, Math.PI / 2.9, true);
    void c.fitToSphere(new THREE.Sphere(center, Math.max(...el.size) * 0.55 + 1.1), true);
  }, [elementId, buildingId, buildings]);


  useFrame((_, dt) => {
    const c = ref.current;
    if (!c || still.current) return;
    const idle = performance.now() - lastTouch.current > 6000;
    if (idle && (!buildingId || locked)) c.azimuthAngle += dt * (buildingId ? 0.03 : 0.045);
  });

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={4}
      maxDistance={200}
      maxPolarAngle={Math.PI * 0.495}
      smoothTime={0.6}
      onStart={() => {
        lastTouch.current = performance.now();
      }}
      onEnd={() => {
        lastTouch.current = performance.now();
      }}
    />
  );
}

/** Section box and 4D playback, both driven from the store. */
function Drivers({ buildings }: { buildings: BuildingSpec[] }) {
  const buildingId = useExplorer((s) => s.buildingId);
  const spec = buildings.find((b) => b.id === buildingId);
  const total = useMemo(() => (spec ? planSequence(spec, elementsFor(spec)).total : 1), [spec]);
  useFrame((_, dt) => {
    const st = useExplorer.getState();
    cutPlane.constant = st.cutHeight ?? 1e4;
    if (st.playing) {
      const next = (st.buildDay ?? 0) + dt * (total / 18);
      if (next >= total) {
        st.setBuildDay(total);
        st.setPlaying(false);
      } else st.setBuildDay(next);
    }
  });
  return null;
}

/** Moves the DOM building labels to sit above each roof. */
function LabelProjector({ buildings }: { buildings: BuildingSpec[] }) {
  const v = useRef(new THREE.Vector3());
  useFrame(({ camera, size }) => {
    for (const b of buildings) {
      const el = labelEls.get(b.id);
      if (!el) continue;
      const { h } = buildingBounds(b);
      v.current.set(b.site.x, h + 2.5, b.site.z).project(camera);
      const x = (v.current.x * 0.5 + 0.5) * size.width;
      const y = (-v.current.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.opacity = v.current.z < 1 ? '1' : '0';
    }
  });
  return null;
}

export function SiteScene({ buildings, locked = false, active = true }: { buildings: BuildingSpec[]; locked?: boolean; active?: boolean }) {
  const quality = useQuality((s) => s.quality);
  const stepDown = useQuality((s) => s.stepDown);
  const [antialias] = useState(() => quality === 'low');
  const buildingId = useExplorer((s) => s.buildingId);
  const style = useExplorer((s) => s.style);
  const sunHour = useExplorer((s) => s.sunHour);
  const selectElement = useExplorer((s) => s.selectElement);
  const down = useRef<{ x: number; y: number } | null>(null);

  const focus = buildings.find((b) => b.id === buildingId);
  const frame = useMemo(() => {
    const list = focus ? [focus] : locked ? [] : buildings;
    if (!list.length) return { center: [0, 0] as [number, number], radius: 30 };
    const box = new THREE.Box3();
    for (const b of list) {
      const { w, d, h } = buildingBounds(b);
      box.expandByPoint(new THREE.Vector3(b.site.x - w / 2, 0, b.site.z - d / 2));
      box.expandByPoint(new THREE.Vector3(b.site.x + w / 2, h, b.site.z + d / 2));
    }
    const c = box.getCenter(new THREE.Vector3());
    return { center: [c.x, c.z] as [number, number], radius: Math.max(12, box.getSize(new THREE.Vector3()).length() / 2) };
  }, [buildings, focus, locked]);

  return (
    <Canvas
      shadows
      camera={{ position: [SITE_VIEW[0], SITE_VIEW[1], SITE_VIEW[2]], fov: 30, near: 0.5, far: 1200 }}
      dpr={QUALITY[quality].dpr}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        bridge.canvas = gl.domElement;
      }}
      onPointerDown={(e) => {
        down.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMissed={(e) => {
        const d = down.current;
        if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;
        selectElement(null);
      }}
    >
      {/* steps the quality down when the frame rate stays low (auto mode only) */}
      <PerformanceMonitor onDecline={stepDown} flipflops={2} />
      <Stage center={frame.center} radius={frame.radius} sunHour={sunHour} realistic={style === 'realistic'} ao={style !== 'hidden'} />
      {buildings.map((b) => {
        // like Revit's isolate: the opened building is shown on its own
        if (buildingId && b.id !== buildingId) return null;
        const mode = !buildingId ? 'site' : 'focus';
        return <StructureModel key={b.id} spec={b} mode={mode} />;
      })}
      <CameraRig buildings={buildings} locked={locked} />
      <Drivers buildings={buildings} />
      {!buildingId && <LabelProjector buildings={buildings} />}
    </Canvas>
  );
}
