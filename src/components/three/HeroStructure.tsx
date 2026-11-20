import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildings } from '../../data/buildings';
import { buildingBounds } from '../../lib/structure/generate';
import { StructureModel, type HeroMotion } from './StructureModel';
import { Stage } from './Stage';
import { QUALITY, useQuality, prefersReducedMotion } from '../../lib/device';

const HOUSE = { ...buildings.find((b) => b.id === 'bayt-al-balad')!, site: { x: 0, z: 0 } };

function fitOrtho(cam: THREE.OrthographicCamera, w: number, h: number, height: number) {
  cam.zoom = Math.min(h / (height * 1.55), w / (height * 1.25));
  cam.lookAt(0, height * 0.5, 0);
  cam.updateProjectionMatrix();
}

/** Keeps the axonometric framed as the canvas resizes. */
function FitOrtho({ height }: { height: number }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => fitOrtho(camera as THREE.OrthographicCamera, size.width, size.height, height), [camera, size, height]);
  return null;
}

function Turntable({ children, still }: { children: React.ReactNode; still: boolean }) {
  const g = useRef<THREE.Group>(null);
  const pointer = useRef(0);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = (e.clientX / window.innerWidth) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  const spin = useRef(0);
  const lean = useRef(0);
  useFrame((_, dt) => {
    if (!g.current || still) return;
    spin.current += dt * 0.06;
    lean.current += (pointer.current * 0.25 - lean.current) * Math.min(1, dt * 2);
    g.current.rotation.y = spin.current + lean.current;
  });
  return <group ref={g}>{children}</group>;
}

/** Realistic exploded axonometric of the Al-Balad house: storeys assemble, then breathe apart. */
export default function HeroStructure() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const still = useMemo(() => prefersReducedMotion(), []);
  const quality = useQuality((s) => s.quality);
  const { h } = buildingBounds(HOUSE);
  const total = h + HOUSE.floors * 1.9;

  const motion = useMemo<HeroMotion>(
    () => ({
      explode: (t) => {
        if (still) return 1.5;
        if (t < 2.4) return 6 - (4.5 * (1 - Math.pow(1 - t / 2.4, 3))); // drops in from far apart
        return 1.5 + 0.45 * Math.sin((t - 2.4) * 0.45);
      },
    }),
    [still],
  );

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="h-full w-full" aria-hidden="true">
      <Canvas
        orthographic
        shadows
        frameloop={visible ? 'always' : 'never'}
        dpr={QUALITY[quality].dpr}
        camera={{ position: [42, 34, 42], near: 0.1, far: 400, zoom: 20 }}
        gl={{ antialias: false }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
        }}
      >
        <FitOrtho height={total} />
        <Stage center={[0, 0]} radius={14} sunHour={15.5} grid={false} background="#09090a" />
        <Turntable still={still}>
          <StructureModel spec={HOUSE} mode="static" hero={motion} />
        </Turntable>
      </Canvas>
    </div>
  );
}
