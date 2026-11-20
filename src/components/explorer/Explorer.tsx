import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react';
import { MousePointerClick, Move3d } from 'lucide-react';
import { elementsFor, levelName } from '../../lib/structure/generate';
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
            onClick={() => selectBuilding(b.id)}
            onMouseEnter={() => hoverBuilding(b.id)}
            onMouseLeave={() => hoverBuilding(null)}
            style={{ opacity: 0 }}
            className={cn(
              'pointer-events-auto absolute left-0 top-0 flex min-h-[40px] items-center gap-3 whitespace-nowrap rounded-full border px-4 font-mono text-[11px] uppercase tracking-[0.14em] backdrop-blur-md transition-[background-color,border-color,color] duration-300',
              on ? 'border-sand bg-sand text-ink-950' : 'border-white/15 bg-ink-950/70 text-bone hover:border-sand',
            )}
          >
            <span className={on ? 'text-ink-950' : 'text-sand'}>{String(i + 1).padStart(2, '0')}</span>
            {b.name}
          </button>
        );
      })}
    </div>
  );
}

/** Small readout of what the pointer is over, bottom-left of the canvas. */
function HoverReadout() {
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
            {el.label} · {levelName(el.level)}
          </>
        ) : spec ? (
          <>
            <MousePointerClick className="h-3.5 w-3.5" /> Click a member
          </>
        ) : (
          <>
            <MousePointerClick className="h-3.5 w-3.5" /> Click a building
          </>
        )}
      </div>
      <div className="label hidden items-center gap-2 sm:flex">
        <Move3d className="h-3.5 w-3.5" /> Drag to orbit · scroll to zoom
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

  return (
    <div className={cn('grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_420px]', className)}>
      <div className="relative h-[72vh] min-h-[480px] bg-ink-950 lg:h-full">
        <SceneBoundary>
          <Suspense fallback={<Loading />}>
            <SiteScene buildings={buildings} locked={!!lockBuildingId} />
          </Suspense>
        </SceneBoundary>
        <SiteLabels />
        <HoverReadout />
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
      <SectionModal el={el} />
    </div>
  );
}
