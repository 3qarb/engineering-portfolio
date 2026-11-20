import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { buildingBounds } from '../lib/structure/generate';
import { useAllBuildings } from '../store/projectsStore';
import { StructureModel } from '../components/three/StructureModel';
import { Stage } from '../components/three/Stage';
import { Framer } from '../components/three/Framer';

/**
 * /render/:id — a clean still of one structure, used to make the project images
 * (captured with playwright-cli into public/renders).
 */
export function RenderPage() {
  const { id } = useParams();
  const all = useAllBuildings();
  const spec = useMemo(() => {
    const b = all.find((x) => x.id === id);
    return b ? { ...b, site: { x: 0, z: 0 } } : undefined;
  }, [all, id]);
  if (!spec) return <p className="p-10 font-mono text-bone">No structure called “{id}”.</p>;
  const { w, d, h } = buildingBounds(spec);

  return (
    <div className="fixed inset-0 z-[400] bg-ink-950">
      <Canvas shadows camera={{ fov: 30, near: 0.5, far: 600 }} dpr={1} gl={{ antialias: false, preserveDrawingBuffer: true }}>
        <Framer w={w} d={d} h={h} onReady={() => (document.body.dataset.renderReady = '1')} />
        <Stage center={[0, 0]} radius={Math.max(w, d, h) * 0.75} sunHour={9.5} grid={false} background="#0c0c0d" />
        <StructureModel spec={spec} mode="static" />
      </Canvas>
    </div>
  );
}
