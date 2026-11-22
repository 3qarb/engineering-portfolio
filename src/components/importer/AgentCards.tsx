import { BookOpen, Boxes, Check, ShieldCheck } from 'lucide-react';
import type { AgentId } from '../../lib/import/pipeline';
import { useTools } from '../../i18n/tools';
import { cn } from '../../utils/cn';

export type AgentState = 'waiting' | 'running' | 'done';

const ICON = { reader: BookOpen, checker: ShieldCheck, builder: Boxes } as const;
const ORDER: AgentId[] = ['reader', 'checker', 'builder'];

/** The three agents in turn, with their state and time. Each card links to its report. */
export function AgentCards({ state, ms }: { state: Record<AgentId, AgentState>; ms?: Record<AgentId, number> }) {
  const t = useTools().importer;
  return (
    <ol className="grid gap-px overflow-hidden border border-white/[0.08] bg-white/[0.08] md:grid-cols-3">
      {ORDER.map((id, i) => {
        const Icon = ICON[id];
        const s = state[id];
        return (
          <li key={id} className="bg-ink-950">
            <a href={s === 'done' ? `#agent-${id}` : undefined} className={cn('flex h-full flex-col gap-4 p-5', s === 'done' && 'transition-colors hover:bg-white/[0.03]')}>
              <div className="flex items-center justify-between">
                <span className="label text-bone-mute">0{i + 1}</span>
                <span
                  className={cn('label inline-flex items-center gap-1.5', s === 'done' ? 'text-sand' : s === 'running' ? 'animate-pulse text-bone' : 'text-bone-mute')}
                  aria-live="polite"
                >
                  {s === 'done' && <Check className="h-3.5 w-3.5" />}
                  {t.state[s]}
                  {s === 'done' && ms && <span className="text-bone-mute">· {t.ms(ms[id])}</span>}
                </span>
              </div>
              <Icon className={cn('h-5 w-5', s === 'waiting' ? 'text-bone-mute' : 'text-bone')} strokeWidth={1.5} />
              <div>
                <p className="text-[17px] text-bone">{t.agents[id].name}</p>
                <p className="mt-1 text-[14px] text-bone-dim">{t.agents[id].role}</p>
              </div>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
