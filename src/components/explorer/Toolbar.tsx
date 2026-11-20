import { useMemo, useState } from 'react';
import { Camera, Pause, Play, RotateCcw, Scissors, SlidersHorizontal, Sun, Tags } from 'lucide-react';
import { buildingBounds, elementsFor } from '../../lib/structure/generate';
import { activeTask, planSequence } from '../../lib/structure/sequence';
import type { BuildingSpec } from '../../lib/structure/types';
import { useExplorer, type VisualStyle } from '../../store/explorerStore';
import { captureView } from '../three/bridge';
import { useQuality, type Quality } from '../../lib/device';
import { cn } from '../../utils/cn';

const STYLES: { id: VisualStyle; label: string }[] = [
  { id: 'realistic', label: 'Realistic' },
  { id: 'shaded', label: 'Shaded' },
  { id: 'hidden', label: 'Hidden line' },
];

const btn =
  'inline-flex h-9 items-center gap-2 rounded-sm px-3 [@media(pointer:coarse)]:h-11 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors';
const idle = 'text-bone-dim hover:bg-white/[0.06] hover:text-bone';
const on = 'bg-bone text-ink-950';

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-r border-white/10 px-3 last:border-r-0">
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-bone-faint">{title}</span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

const hourLabel = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

/** Revit-like ribbon: visual style, sun, section box, 4D sequence, annotations, export. */
export function Toolbar({ spec }: { spec?: BuildingSpec }) {
  const [open, setOpen] = useState(false);
  const style = useExplorer((s) => s.style);
  const setStyle = useExplorer((s) => s.setStyle);
  const sunHour = useExplorer((s) => s.sunHour);
  const setSunHour = useExplorer((s) => s.setSunHour);
  const cutHeight = useExplorer((s) => s.cutHeight);
  const setCutHeight = useExplorer((s) => s.setCutHeight);
  const annotations = useExplorer((s) => s.annotations);
  const toggleAnnotations = useExplorer((s) => s.toggleAnnotations);
  const buildDay = useExplorer((s) => s.buildDay);
  const setBuildDay = useExplorer((s) => s.setBuildDay);
  const playing = useExplorer((s) => s.playing);
  const quality = useQuality((s) => s.quality);
  const setQuality = useQuality((s) => s.set);
  const setPlaying = useExplorer((s) => s.setPlaying);

  const plan = useMemo(() => (spec ? planSequence(spec, elementsFor(spec)) : null), [spec]);
  const height = spec ? buildingBounds(spec).h : 0;
  const task = plan && buildDay !== null ? activeTask(plan, buildDay) : undefined;

  const play = () => {
    if (!plan) return;
    if (playing) return setPlaying(false);
    if (buildDay === null || buildDay >= plan.total) setBuildDay(0);
    setPlaying(true);
  };

  return (
    <div className="pointer-events-auto max-w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cn(btn, 'mb-2 border border-white/15 bg-ink-900/85 backdrop-blur-md xl:hidden', open ? 'text-sand' : 'text-bone')}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" /> View tools
      </button>
      <div
        className={cn(
          'no-scrollbar max-w-full flex-wrap items-stretch gap-y-3 overflow-x-auto rounded-sm border border-white/10 bg-ink-900/85 py-2.5 backdrop-blur-md xl:flex',
          open ? 'flex' : 'hidden',
        )}
        role="toolbar"
        aria-label="View tools"
      >
        <Group title="Visual style">
          {STYLES.map((s) => (
            <button key={s.id} type="button" aria-pressed={style === s.id} onClick={() => setStyle(s.id)} className={cn(btn, style === s.id ? on : idle)}>
              {s.label}
            </button>
          ))}
        </Group>

        <Group title="Sun">
          <Sun className="h-3.5 w-3.5 text-sand" />
          <input
            type="range"
            min={6}
            max={18}
            step={0.25}
            value={sunHour}
            onChange={(e) => setSunHour(Number(e.target.value))}
            className="w-24 accent-[#c9a46c]"
            aria-label="Sun time of day"
          />
          <span className="w-11 font-mono text-[11px] text-bone">{hourLabel(sunHour)}</span>
        </Group>

        {spec && plan && (
          <>
            <Group title="Section box">
              <button
                type="button"
                aria-pressed={cutHeight !== null}
                onClick={() => setCutHeight(cutHeight === null ? Math.round(height * 0.55 * 10) / 10 : null)}
                className={cn(btn, cutHeight !== null ? on : idle)}
              >
                <Scissors className="h-3.5 w-3.5" /> Cut
              </button>
              {cutHeight !== null && (
                <>
                  <input
                    type="range"
                    min={0.2}
                    max={height + 0.5}
                    step={0.05}
                    value={cutHeight}
                    onChange={(e) => setCutHeight(Number(e.target.value))}
                    className="w-24 accent-[#c9a46c]"
                    aria-label="Section cut height"
                  />
                  <span className="w-14 font-mono text-[11px] text-bone">+{cutHeight.toFixed(2)}</span>
                </>
              )}
            </Group>

            <Group title="4D sequence">
              <button type="button" onClick={play} className={cn(btn, playing ? on : idle)} aria-label={playing ? 'Pause construction sequence' : 'Play construction sequence'}>
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {playing ? 'Pause' : 'Build'}
              </button>
              <input
                type="range"
                min={0}
                max={plan.total}
                step={0.1}
                value={buildDay ?? plan.total}
                onChange={(e) => {
                  setPlaying(false);
                  setBuildDay(Number(e.target.value));
                }}
                className="w-28 accent-[#c9a46c]"
                aria-label="Construction day"
              />
              {buildDay !== null && (
                <button type="button" onClick={() => (setPlaying(false), setBuildDay(null))} className={cn(btn, idle, 'px-2')} aria-label="Show the finished building">
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </Group>

            <Group title="Annotate">
              <button type="button" aria-pressed={annotations} onClick={toggleAnnotations} className={cn(btn, annotations ? on : idle)}>
                <Tags className="h-3.5 w-3.5" /> Grids & levels
              </button>
            </Group>
          </>
        )}

        <Group title="Quality">
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as Quality)}
            className={cn(btn, idle, 'bg-transparent pr-2')}
            aria-label="Render quality"
          >
            <option value="high">High</option>
            <option value="balanced">Balanced</option>
            <option value="low">Low</option>
          </select>
        </Group>

        <Group title="Export">
          <button type="button" onClick={() => captureView(`${spec?.id ?? 'site'}-view.png`)} className={cn(btn, idle)}>
            <Camera className="h-3.5 w-3.5" /> PNG
          </button>
        </Group>
      </div>

      {task && (
        <p className="mt-2 inline-flex items-center gap-2 rounded-sm border border-sand/40 bg-ink-950/80 px-3 py-2 font-mono text-[11px] text-bone backdrop-blur-md">
          <span className="text-sand">Day {Math.floor(buildDay ?? 0)}</span> {task.name}
        </p>
      )}
    </div>
  );
}
