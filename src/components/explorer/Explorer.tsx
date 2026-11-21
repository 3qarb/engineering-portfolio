import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Info, MousePointerClick, Move3d } from 'lucide-react';
import { hasWebGL } from '../../lib/device';
import type { BuildingSpec } from '../../lib/structure/types';
import { buildings as builtIn } from '../../data/buildings';
import { elementsFor, elementLevel } from '../../lib/structure/generate';
import { useAllBuildings, useAllProjects } from '../../store/projectsStore';
import { useExplorer } from '../../store/explorerStore';
import { ExplorerPanel } from './ExplorerPanel';
import { SectionModal } from './SectionModal';
import { Toolbar } from './Toolbar';
import { ViewCube } from './ViewCube';
import { cn } from '../../utils/cn';
import { labelEls } from '../three/labels';

const SiteScene = lazy(() => import('../three/SiteScene').then((m) => ({ default: m.SiteScene })));

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="grid h-full place-items-center p-8 text-center">
          <p className="max-w-sm text-[15px] text-bone-dim">
            This browser could not start the 3D view. The building list and every section drawing still work from the panel.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Shown when the browser has no WebGL: the pre-rendered image; the panel keeps working. */
function StaticFallback({ spec }: { spec?: BuildingSpec }) {
  const shown = spec && builtIn.some((b) => b.id === spec.id) ? spec : builtIn[0];
  return (
    <div className="relative h-full w-full">
      <img src={`/renders/${shown.id}.jpg`} alt={`Rendered 3D model: ${shown.name}`} className="h-full w-full object-cover" />
      <p className="absolute inset-x-4 bottom-14 max-w-md border border-white/15 bg-ink-950/85 p-4 text-[14px] leading-snug text-bone-dim">
        This browser cannot show the interactive 3D view, so a rendered image is shown instead. Buildings, members,
        section drawings and schedules still work from the panel.
      </p>
    </div>
  );
}

/** Tag on the canvas: these models use typical sizes unless the spec says otherwise. */
function BasisTag({ spec }: { spec?: BuildingSpec }) {
  if (!spec || spec.basis === 'project') return null;
  return (
    <p className="label pointer-events-none flex items-center gap-1.5 text-bone-mute" title="Typical member sizes chosen to show the structural system. Not a project design.">
      <Info className="h-3 w-3" /> Illustrative model · typical sizes
    </p>
  );
}

function Loading() {
  return (
    <div className="grid h-full place-items-center">
      <span className="label animate-pulse">Raising the structure…</span>
    </div>
  );
}

/** Building name tags over the site; the scene moves them each frame. */
function SiteLabels() {
  const buildings = useAllBuildings();
  const buildingId = useExplorer((s) => s.buildingId);
  const hoverId = useExplorer((s) => s.hoverBuildingId);
  const selectBuilding = useExplorer((s) => s.selectBuilding);
  const hoverBuilding = useExplorer((s) => s.hoverBuilding);
  if (buildingId) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {buildings.map((b, i) => {
        const on = hoverId === b.id;
        return (
          <button
            key={b.id}
            ref={(el) => {
              if (el) labelEls.set(b.id, el);
              else labelEls.delete(b.id);
            }}
            type="button"
            aria-label={b.name}
            onClick={() => selectBuilding(b.id)}
            onMouseEnter={() => hoverBuilding(b.id)}
            onMouseLeave={() => hoverBuilding(null)}
            style={{ opacity: 0 }}
            className={cn(
              'pointer-events-auto absolute left-0 top-0 flex min-h-[44px] min-w-[44px] justify-center items-center gap-2 whitespace-nowrap rounded-sm border px-3 sm:gap-3 sm:px-4 font-mono text-[11px] uppercase tracking-[0.14em] backdrop-blur-md transition-[background-color,border-color,color] duration-300',
              on ? 'border-sand bg-sand text-ink-950' : 'border-white/15 bg-ink-950/70 text-bone hover:border-sand',
            )}
          >
            <span className={on ? 'text-ink-950' : 'text-sand'}>{String(i + 1).padStart(2, '0')}</span>
            <span className="hidden sm:inline">{b.name}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Small readout of what the pointer is over, bottom-left of the canvas. */
function HoverReadout() {
  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const buildings = useAllBuildings();
  const buildingId = useExplorer((s) => s.buildingId);
  const hoverEl = useExplorer((s) => s.hoverElementId);
  const spec = buildings.find((b) => b.id === buildingId);
  const el = spec && hoverEl ? elementsFor(spec).find((e) => e.id === hoverEl) : undefined;

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
      <div className="label flex min-h-[20px] items-center gap-2 text-bone-dim">
        {el ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-sand" />
            {el.label} · {elementLevel(el)}
          </>
        ) : spec ? (
          <>
            <MousePointerClick className="h-3.5 w-3.5" /> {touch ? 'Tap a member' : 'Click a member'}
          </>
        ) : (
          <>
            <MousePointerClick className="h-3.5 w-3.5" /> {touch ? 'Tap a building' : 'Click a building'}
          </>
        )}
      </div>
      <div className="label hidden items-center gap-2 sm:flex">
        <Move3d className="h-3.5 w-3.5" /> {touch ? 'Drag to orbit · pinch to zoom' : 'Drag to orbit · scroll to zoom'}
      </div>
    </div>
  );
}

export function Explorer({ lockBuildingId, className }: { lockBuildingId?: string; className?: string }) {
  const buildings = useAllBuildings();
  const projects = useAllProjects();
  const selectBuilding = useExplorer((s) => s.selectBuilding);
  const reset = useExplorer((s) => s.reset);
  const buildingId = useExplorer((s) => s.buildingId);
  const elementId = useExplorer((s) => s.elementId);

  useEffect(() => {
    if (lockBuildingId) selectBuilding(lockBuildingId);
    return () => {
      reset();
      document.body.style.cursor = '';
    };
  }, [lockBuildingId, selectBuilding, reset]);

  const spec = buildings.find((b) => b.id === buildingId);
  const el = spec && elementId ? elementsFor(spec).find((e) => e.id === elementId) : undefined;

  // render only while the canvas is on screen
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [gl] = useState(hasWebGL);
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '120px' });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div dir="ltr" lang="en" className={cn('grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_420px]', className)}>
      <div ref={stage} className="relative h-[68svh] min-h-[420px] bg-ink-950 lg:h-full">
        {gl ? (
          <SceneBoundary>
            <Suspense fallback={<Loading />}>
              <SiteScene buildings={buildings} locked={!!lockBuildingId} active={active} />
            </Suspense>
          </SceneBoundary>
        ) : (
          <StaticFallback spec={spec} />
        )}
        {gl && <SiteLabels />}
        <HoverReadout />
        <div className="pointer-events-none absolute bottom-10 left-4 sm:bottom-11">
          <BasisTag spec={spec} />
        </div>
        <div className="pointer-events-none absolute left-3 right-24 top-3 sm:left-4 sm:top-4">
          <Toolbar spec={spec} />
        </div>
        <div className="pointer-events-none absolute right-4 top-4">
          <ViewCube />
        </div>
      </div>
      <aside className="no-scrollbar border-t border-white/10 bg-ink-900 p-6 sm:p-8 lg:overflow-y-auto lg:border-l lg:border-t-0">
        <ExplorerPanel buildings={buildings} projects={projects} locked={!!lockBuildingId} />
      </aside>
      <SectionModal el={el} project={spec?.basis === 'project'} />
    </div>
  );
}
