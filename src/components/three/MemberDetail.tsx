import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { cageFor } from '../../lib/structure/rebar';
import type { StructuralElement } from '../../lib/structure/types';
import { detailGeometry, fillerBoxes } from './render/geometry';
import { blockMaterial, detailEdge, glassConcrete, glassEdge, materialKey, materialSet, selectEdge, voidMaterial } from './render/materials';
import { RebarCage } from './RebarCage';

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const noRaycast = () => null;

/** Hollow blocks or void formers between the ribs of a ribbed slab, instanced. */
function Fillers({ el, keep }: { el: StructuralElement; keep?: (x: number, z: number) => boolean }) {
  const boxes = useMemo(() => fillerBoxes(el, keep), [el, keep]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    boxes.forEach((b, i) => {
      m.compose(new THREE.Vector3(...b.position), q, new THREE.Vector3(...b.size));
      ref.current?.setMatrixAt(i, m);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [boxes]);
  if (!boxes.length || el.section.kind !== 'ribbed-slab') return null;
  const mat = el.section.filler === 'void' ? voidMaterial : blockMaterial;
  return (
    <group position={el.position} rotation={el.rotation}>
      <instancedMesh ref={ref} args={[unitBox, mat, boxes.length]} frustumCulled={false} raycast={noRaycast} castShadow />
    </group>
  );
}

/**
 * One member drawn as built: its real shape (ribs and topping, drop panel, steps), the blocks
 * between ribs, and — with `rebar` — see-through concrete with the reinforcement cage inside.
 */
export function MemberDetail({
  el,
  rebar,
  selected = false,
  keepFiller,
}: {
  el: StructuralElement;
  rebar: boolean;
  selected?: boolean;
  /** Which hollow blocks to draw; leave some out to show the rib bars */
  keepFiller?: (x: number, z: number) => boolean;
}) {
  const caged = rebar && !!cageFor(el);
  const geometry = useMemo(() => detailGeometry(el), [el]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 30), [geometry]);
  const mat = caged ? glassConcrete : materialSet('realistic')[materialKey(el)];
  return (
    <group>
      <mesh geometry={geometry} material={mat} position={el.position} rotation={el.rotation} castShadow={!caged} receiveShadow raycast={noRaycast} />
      <lineSegments geometry={edges} position={el.position} rotation={el.rotation} material={caged ? detailEdge : selected ? selectEdge : glassEdge} raycast={noRaycast} />
      <Fillers el={el} keep={keepFiller} />
      {caged && <RebarCage el={el} />}
    </group>
  );
}
