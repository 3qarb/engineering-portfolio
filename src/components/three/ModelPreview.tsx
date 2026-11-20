import { Canvas } from '@react-three/fiber';
import type { BuildingSpec } from '../../lib/structure/types';
import { buildingBounds } from '../../lib/structure/generate';
import { StructureModel } from './StructureModel';
import { Stage } from './Stage';
import { Framer } from './Framer';

/** A single realistic still-life of one structure; the canvas is handed back for snapshots. */
export default function ModelPreview({
  spec,
  onCanvas,
  onReady,
}: {
  spec: BuildingSpec;
  onCanvas?: (c: HTMLCanvasElement) => void;
  onReady?: () => void;
}) {
  const placed = { ...spec, site: { x: 0, z: 0 } };
  const { w, d, h } = buildingBounds(placed);
  return (
    <Canvas
      shadows
      camera={{ fov: 30, near: 0.5, far: 600 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        onCanvas?.(gl.domElement);
      }}
    >
      <Framer w={w} d={d} h={h} onReady={onReady} />
      <Stage center={[0, 0]} radius={Math.max(w, d, h) * 0.75} sunHour={9.5} grid={false} background="#0c0c0d" />
      <StructureModel spec={placed} mode="static" />
    </Canvas>
  );
}
