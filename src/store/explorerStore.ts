import { create } from 'zustand';
import type { ElementKind } from '../lib/structure/types';

export type VisualStyle = 'realistic' | 'shaded' | 'hidden';

interface ExplorerState {
  buildingId: string | null;
  elementId: string | null;
  hoverElementId: string | null;
  hoverBuildingId: string | null;
  sectionOpen: boolean;
  exploded: boolean;
  isolateLevel: number | null;
  hiddenKinds: ElementKind[];
  /** Revit-style visual style */
  style: VisualStyle;
  /** Horizontal section-box cut, metres above ground; null = off */
  cutHeight: number | null;
  /** Show the reinforcement cage inside the selected member */
  showRebar: boolean;
  /** Grid bubbles and level heads */
  annotations: boolean;
  /** Sun time, hours 6–18 */
  sunHour: number;
  /** 4D construction time in days; null = finished building */
  buildDay: number | null;
  playing: boolean;
  selectBuilding: (id: string | null) => void;
  selectElement: (id: string | null) => void;
  hoverElement: (id: string | null) => void;
  hoverBuilding: (id: string | null) => void;
  openSection: (open: boolean) => void;
  toggleExploded: () => void;
  setIsolateLevel: (l: number | null) => void;
  toggleKind: (k: ElementKind) => void;
  setStyle: (s: VisualStyle) => void;
  setCutHeight: (h: number | null) => void;
  toggleRebar: () => void;
  toggleAnnotations: () => void;
  setSunHour: (h: number) => void;
  setBuildDay: (d: number | null) => void;
  setPlaying: (p: boolean) => void;
  reset: () => void;
}

const perBuilding = {
  elementId: null,
  hoverElementId: null,
  sectionOpen: false,
  exploded: false,
  isolateLevel: null,
  hiddenKinds: [] as ElementKind[],
  cutHeight: null,
  buildDay: null,
  playing: false,
};

const initial = {
  ...perBuilding,
  buildingId: null,
  hoverBuildingId: null,
  style: 'realistic' as VisualStyle,
  showRebar: true,
  annotations: true,
  sunHour: 10,
};

export const useExplorer = create<ExplorerState>()((set) => ({
  ...initial,
  selectBuilding: (id) => set({ ...perBuilding, buildingId: id }),
  selectElement: (id) => set({ elementId: id, sectionOpen: false }),
  hoverElement: (id) => set({ hoverElementId: id }),
  hoverBuilding: (id) => set({ hoverBuildingId: id }),
  openSection: (open) => set({ sectionOpen: open }),
  toggleExploded: () => set((s) => ({ exploded: !s.exploded })),
  setIsolateLevel: (l) => set({ isolateLevel: l }),
  toggleKind: (k) =>
    set((s) => ({
      hiddenKinds: s.hiddenKinds.includes(k) ? s.hiddenKinds.filter((x) => x !== k) : [...s.hiddenKinds, k],
    })),
  setStyle: (style) => set({ style }),
  setCutHeight: (cutHeight) => set({ cutHeight }),
  toggleRebar: () => set((s) => ({ showRebar: !s.showRebar })),
  toggleAnnotations: () => set((s) => ({ annotations: !s.annotations })),
  setSunHour: (sunHour) => set({ sunHour }),
  setBuildDay: (buildDay) => set({ buildDay }),
  setPlaying: (playing) => set({ playing }),
  reset: () => set(initial),
}));
