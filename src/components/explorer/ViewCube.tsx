import { useEffect, useRef } from 'react';
import { Home } from 'lucide-react';
import { bridge, goToView, type VIEWS } from '../three/bridge';

const S = 64;
const FACES: { view: keyof typeof VIEWS; label: string; transform: string }[] = [
  { view: 'front', label: 'Front', transform: `translateZ(${S / 2}px)` },
  { view: 'back', label: 'Back', transform: `rotateY(180deg) translateZ(${S / 2}px)` },
  { view: 'right', label: 'Right', transform: `rotateY(90deg) translateZ(${S / 2}px)` },
  { view: 'left', label: 'Left', transform: `rotateY(-90deg) translateZ(${S / 2}px)` },
  { view: 'top', label: 'Top', transform: `rotateX(90deg) translateZ(${S / 2}px)` },
];

/** Autodesk-style ViewCube: mirrors the camera and snaps to a face when clicked. */
export function ViewCube() {
  const cube = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const c = bridge.controls;
      if (c && cube.current) {
        const az = c.azimuthAngle;
        const polar = c.polarAngle;
        cube.current.style.transform = `translateZ(-${S}px) rotateX(${(polar - Math.PI / 2) * (180 / Math.PI)}deg) rotateY(${-az * (180 / Math.PI)}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-2">
      <div className="relative" style={{ width: S, height: S, perspective: 400 }}>
        <div ref={cube} className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
          {FACES.map((f) => (
            <button
              key={f.view}
              type="button"
              onClick={() => goToView(f.view)}
              className="absolute inset-0 grid place-items-center border border-white/25 bg-ink-800/90 font-mono text-[9px] uppercase tracking-[0.1em] text-bone-dim transition-colors hover:bg-sand hover:text-ink-950"
              style={{ transform: f.transform, backfaceVisibility: 'hidden' }}
              aria-label={`${f.label} view`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => goToView('home')}
        className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-ink-900/80 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11 text-bone-dim transition-colors hover:border-sand hover:text-sand"
        aria-label="Home view"
      >
        <Home className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
