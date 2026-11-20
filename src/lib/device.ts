import { create } from 'zustand';

/** Render quality for the 3D views. */
export type Quality = 'high' | 'balanced' | 'low';

export interface QualitySettings {
  dpr: [number, number];
  shadowMap: number;
  shadows: boolean;
  /** Ambient occlusion (N8AO) — the most expensive pass */
  ao: boolean;
  /** Post-processing chain at all (SMAA, tone mapping, vignette) */
  post: boolean;
}

export const QUALITY: Record<Quality, QualitySettings> = {
  high: { dpr: [1, 1.5], shadowMap: 2048, shadows: true, ao: true, post: true },
  balanced: { dpr: [1, 1.25], shadowMap: 1024, shadows: true, ao: false, post: true },
  low: { dpr: [1, 1], shadowMap: 512, shadows: false, ao: false, post: false },
};

const ORDER: Quality[] = ['high', 'balanced', 'low'];

let webgl: boolean | undefined;
/** True when the browser can create a WebGL context. Cached after the first call. */
export function hasWebGL(): boolean {
  if (webgl !== undefined) return webgl;
  try {
    const c = document.createElement('canvas');
    webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    webgl = false;
  }
  return webgl;
}

/** A first guess from the hardware; PerformanceMonitor refines it while the scene runs. */
export function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'balanced';
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.screen.width, window.screen.height) < 768;
  if (cores <= 2 || memory <= 2) return 'low';
  if (coarse || small || cores <= 4) return 'balanced';
  return 'high';
}

interface QualityState {
  quality: Quality;
  /** false once the visitor picks a quality by hand */
  auto: boolean;
  set: (q: Quality) => void;
  /** Called by PerformanceMonitor when frame rate stays low */
  stepDown: () => void;
}

export const useQuality = create<QualityState>()((set, get) => ({
  quality: detectQuality(),
  auto: true,
  set: (quality) => set({ quality, auto: false }),
  stepDown: () => {
    const { quality, auto } = get();
    if (!auto) return;
    const next = ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(quality) + 1)];
    if (next !== quality) set({ quality: next });
  },
}));

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
