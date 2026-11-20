import type { CameraControls } from '@react-three/drei';

/** Handles the DOM toolbar and ViewCube use to talk to the 3D view. */
export const bridge: {
  controls: CameraControls | null;
  canvas: HTMLCanvasElement | null;
} = { controls: null, canvas: null };

/** Camera presets in camera-controls terms: azimuth from +Z, polar from +Y. */
export const VIEWS = {
  home: [Math.PI / 4, Math.PI / 2.7],
  front: [0, Math.PI / 2],
  right: [Math.PI / 2, Math.PI / 2],
  back: [Math.PI, Math.PI / 2],
  left: [-Math.PI / 2, Math.PI / 2],
  top: [0, 0.0001],
} as const;

export function goToView(view: keyof typeof VIEWS) {
  const [az, polar] = VIEWS[view];
  void bridge.controls?.rotateTo(az, polar, true);
}

export function captureView(filename: string) {
  const c = bridge.canvas;
  if (!c) return;
  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = filename;
  a.click();
}
