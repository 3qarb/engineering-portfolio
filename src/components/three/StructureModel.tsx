import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { elementsFor } from '../../lib/structure/generate';
import { cageFor } from '../../lib/structure/rebar';
import { planSequence } from '../../lib/structure/sequence';
import type { BuildingSpec, StructuralElement } from '../../lib/structure/types';
import { useExplorer, type VisualStyle } from '../../store/explorerStore';
import { boxEdgeCorners, geometryKey, memberGeometry } from './render/geometry';
import {
  capMaterial,
  edgeGhostMaterial,
  edgeLineMaterial,
  ghostMaterials,
  glassConcrete,
  glassEdge,
  materialKey,
  materialSet,
  selectEdge,
  type MatKey,
} from './render/materials';
import { RebarCage } from './RebarCage';
import { Annotations } from './Annotations';

export const EXPLODE_GAP = 2.4;
export type ModelMode = 'site' | 'focus' | 'context' | 'static';

const WHITE = new THREE.Color('#ffffff');
const HOVER = new THREE.Color('#ffe3b5');
const SELECT = new THREE.Color('#f3bf62');
const BUILDING = new THREE.Color('#ffcf85');
const noRaycast = () => null;
const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isVertical = (e: StructuralElement) => !e.rotation && e.size[1] >= e.size[0] && e.size[1] >= e.size[2];

interface Group {
  key: string;
  geometry: THREE.BufferGeometry;
  mat: MatKey;
  elements: StructuralElement[];
}

/** Pushes freshly written edge vertices to the GPU. */
function writeEdges(g: THREE.BufferGeometry, count: number) {
  g.attributes.position.needsUpdate = true;
  g.setDrawRange(0, count);
  g.computeBoundingSphere();
}

export interface HeroMotion {
  /** Storey separation (metres per storey) at clock time t */
  explode: (t: number) => number;
}

export function StructureModel({
  spec,
  mode,
  hero,
  styleOverride,
}: {
  spec: BuildingSpec;
  mode: ModelMode;
  hero?: HeroMotion;
  styleOverride?: VisualStyle;
}) {
  const elements = elementsFor(spec);
  const plan = useMemo(() => planSequence(spec, elements), [spec, elements]);
  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const el of elements) {
      const mat = materialKey(el);
      const key = `${geometryKey(el)}|${mat}`;
      const g = map.get(key) ?? { key, geometry: memberGeometry(el), mat, elements: [] };
      g.elements.push(el);
      map.set(key, g);
    }
    return [...map.values()];
  }, [elements]);
  const levels = useMemo(() => [...new Set(elements.map((e) => e.level))].sort((a, b) => a - b), [elements]);
  const quats = useMemo(
    () => new Map(elements.map((e) => [e.id, new THREE.Quaternion().setFromEuler(new THREE.Euler(...(e.rotation ?? [0, 0, 0])))])),
    [elements],
  );
  const corners = useMemo(() => new Map(elements.map((e) => [e.id, boxEdgeCorners(...e.size)])), [elements]);
  const edges = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(elements.length * 72), 3));
    return { geometry: g, write: (count: number) => writeEdges(g, count) };
  }, [elements]);

  const storeStyle = useExplorer((s) => s.style);
  const style = styleOverride ?? (mode === 'static' ? 'realistic' : storeStyle);
  const realMats = materialSet(style);
  const cutOn = useExplorer((s) => s.cutHeight !== null) && mode === 'focus';
  const selectedId = useExplorer((s) => (mode === 'focus' ? s.elementId : null));
  const showRebar = useExplorer((s) => s.showRebar);
  const annotations = useExplorer((s) => s.annotations);
  const selected = selectedId ? elements.find((e) => e.id === selectedId) : undefined;
  const caged = !!selected && showRebar && !!cageFor(selected);
  // with a member selected, the rest of the building ghosts so the member is never hidden
  const ghost = !!selected;
  const mats = ghost ? ghostMaterials() : realMats;

  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const offsets = useRef(new Map<number, number>());
  const born = useRef<number | null>(null);
  const lastSig = useRef('');
  const overlay = useRef<THREE.Group>(null);
  const reduced = useRef(reducedMotion());

  useEffect(() => {
    born.current = null;
    offsets.current.clear();
    lastSig.current = '';
  }, [mode]);

  useEffect(() => {
    lastSig.current = '';
  }, [style]);

  useFrame((state, dt) => {
    const st = useExplorer.getState();
    const focus = mode === 'focus';
    const now = performance.now();
    born.current ??= now;
    const elapsed = (now - born.current) / 1000;
    const intro = focus && !reduced.current;

    // storey offsets: intro drop-in, explode, hero breathing
    let animating = false;
    const hiddenLevel = new Set<number>();
    for (const L of levels) {
      let target = 0;
      if (focus && st.exploded) target = (L + 1) * EXPLODE_GAP;
      if (hero) target = hero.explode(state.clock.elapsedTime) * (L + 1);
      let cur = offsets.current.get(L);
      if (cur === undefined) cur = intro ? 9 + (L + 1) * 2.2 : target;
      if (intro && elapsed < (L + 1) * 0.11) {
        hiddenLevel.add(L);
        animating = true;
      } else {
        cur = reduced.current || hero ? target : THREE.MathUtils.damp(cur, target, 6, dt);
      }
      if (Math.abs(cur - target) > 0.002) animating = true;
      offsets.current.set(L, cur);
    }
    if (hero) animating = true;

    if (overlay.current && selected) overlay.current.position.y = offsets.current.get(selected.level) ?? 0;

    const day = focus ? st.buildDay : null;
    const sig = [
      mode,
      st.isolateLevel,
      st.hiddenKinds.join(),
      day === null ? 'x' : Math.round(day * 20),
      st.elementId,
      st.hoverElementId,
      st.hoverBuildingId,
      st.showRebar,
      style,
      ghost,
    ].join('|');
    if (!animating && sig === lastSig.current) return;
    lastSig.current = sig;

    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    const v = new THREE.Vector3();
    const edgeArr = edges.geometry.attributes.position.array as Float32Array;
    const wantEdges = style !== 'realistic' || (focus && st.elementId !== null);
    let ew = 0;
    const buildingHover = !focus && st.hoverBuildingId === spec.id;

    groups.forEach((g, gi) => {
      const mesh = meshRefs.current[gi];
      if (!mesh) return;
      g.elements.forEach((el, i) => {
        const w = plan.windowOf.get(el.id)!;
        let p = 1;
        if (day !== null) p = day < w.start ? 0 : THREE.MathUtils.clamp((day - w.start) / Math.max(1e-6, w.finish - w.start), 0, 1);
        let visible = p > 0 && !hiddenLevel.has(el.level);
        if (focus) {
          if (st.hiddenKinds.includes(el.kind)) visible = false;
          if (st.isolateLevel !== null && el.level !== st.isolateLevel) visible = false;
        }
        const isSel = focus && st.elementId === el.id;
        if (isSel) visible = false; // drawn by the overlay

        const off = offsets.current.get(el.level) ?? 0;
        pos.set(el.position[0], el.position[1] + off, el.position[2]);
        scl.set(1, 1, 1);
        if (visible && p < 1) {
          if (isVertical(el)) {
            scl.y = Math.max(p, 0.001);
            pos.y = el.position[1] - el.size[1] / 2 + off + (el.size[1] * p) / 2;
          } else pos.y += (1 - p) * 1.6;
        }
        if (!visible) scl.set(0, 0, 0);
        m.compose(pos, quats.get(el.id)!, scl);
        mesh.setMatrixAt(i, m);

        const hov = (focus && st.hoverElementId === el.id) || buildingHover;
        mesh.setColorAt(i, isSel ? SELECT : hov ? HOVER : p > 0 && p < 1 ? BUILDING : WHITE);

        if (wantEdges) {
          const c = corners.get(el.id)!;
          for (let k = 0; k < 24; k++) {
            if (visible) v.set(c[k * 3], c[k * 3 + 1], c[k * 3 + 2]).applyMatrix4(m);
            else v.set(0, 0, 0);
            edgeArr[ew++] = v.x;
            edgeArr[ew++] = v.y;
            edgeArr[ew++] = v.z;
          }
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
    if (wantEdges) edges.write(ew / 3);
  });

  const interactive = mode !== 'static';
  const handlers = (g: Group) =>
    interactive
      ? {
          onPointerMove: (e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            const el = e.instanceId !== undefined ? g.elements[e.instanceId] : undefined;
            if (!el) return;
            const st = useExplorer.getState();
            if (mode === 'focus') {
              if (st.hoverElementId !== el.id) st.hoverElement(el.id);
            } else if (st.hoverBuildingId !== spec.id) st.hoverBuilding(spec.id);
            document.body.style.cursor = 'pointer';
          },
          onPointerOut: () => {
            const st = useExplorer.getState();
            st.hoverElement(null);
            st.hoverBuilding(null);
            document.body.style.cursor = '';
          },
          onClick: (e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            if (e.delta > 6) return;
            const el = e.instanceId !== undefined ? g.elements[e.instanceId] : undefined;
            const st = useExplorer.getState();
            if (mode === 'focus' && el) st.selectElement(el.id);
            else {
              document.body.style.cursor = '';
              st.hoverBuilding(null);
              st.selectBuilding(spec.id);
            }
          },
        }
      : { raycast: noRaycast };

  return (
    <group position={[spec.site.x, 0, spec.site.z]}>
      {groups.map((g, gi) => (
        <group key={g.key}>
          <instancedMesh
            ref={(m) => {
              meshRefs.current[gi] = m;
              if (m && !m.instanceColor) {
                for (let i = 0; i < g.elements.length; i++) m.setColorAt(i, WHITE);
              }
              lastSig.current = '';
            }}
            args={[g.geometry, mats[g.mat], g.elements.length]}
            material={mats[g.mat]}
            castShadow={style === 'realistic' && !ghost}
            receiveShadow={style === 'realistic' && !ghost}
            frustumCulled={false}
            {...handlers(g)}
          />
          {cutOn && (
            <instancedMesh
              ref={(m) => {
                const main = meshRefs.current[gi];
                if (m && main) m.instanceMatrix = main.instanceMatrix;
              }}
              args={[g.geometry, capMaterial, g.elements.length]}
              frustumCulled={false}
              raycast={noRaycast}
            />
          )}
        </group>
      ))}
      <lineSegments
        geometry={edges.geometry}
        material={ghost ? edgeGhostMaterial : edgeLineMaterial}
        visible={style !== 'realistic' || ghost}
        frustumCulled={false}
        raycast={noRaycast}
      />

      {selected && (
        <group ref={overlay}>
          <mesh
            geometry={memberGeometry(selected)}
            material={caged ? glassConcrete : realMats[materialKey(selected)]}
            position={selected.position}
            rotation={selected.rotation}
            castShadow={!caged}
            raycast={noRaycast}
          />
          <lineSegments position={selected.position} rotation={selected.rotation} material={caged ? glassEdge : selectEdge} raycast={noRaycast}>
            <edgesGeometry args={[new THREE.BoxGeometry(...selected.size)]} />
          </lineSegments>
          {caged && <RebarCage el={selected} />}
        </group>
      )}

      {mode === 'focus' && annotations && <Annotations spec={spec} offsets={offsets} />}
    </group>
  );
}
