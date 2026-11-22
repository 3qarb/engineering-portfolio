import { levelName } from './generate';
import type { BuildingSpec, StructuralElement } from './types';

/**
 * A typical planned construction sequence, generated from the model.
 * Durations are illustrative working days, not a site programme.
 */
export interface Task {
  id: string;
  name: string;
  /** Half-open window [start, finish) in days */
  start: number;
  finish: number;
  elementIds: string[];
}

export interface Plan {
  tasks: Task[];
  windowOf: Map<string, { start: number; finish: number }>;
  total: number;
}

type Phase = { key: string; label: string; days: number; match: (e: StructuralElement) => boolean };

const vertical = (e: StructuralElement) => e.size[1] >= e.size[0] && e.size[1] >= e.size[2];

const PHASES: Record<BuildingSpec['system'], Phase[]> = {
  'rc-frame': [
    { key: 'col', label: 'columns & walls', days: 4, match: (e) => e.kind === 'column' || e.kind === 'wall' },
    { key: 'beam', label: 'beams', days: 5, match: (e) => e.kind === 'beam' },
    { key: 'slab', label: 'slab', days: 6, match: (e) => e.kind === 'slab' || e.kind === 'stair' || e.kind === 'ramp' },
  ],
  'heritage-masonry': [
    { key: 'wall', label: 'stone walls', days: 9, match: (e) => e.kind === 'wall' },
    { key: 'beam', label: 'lintels & joists', days: 4, match: (e) => e.kind === 'beam' },
    { key: 'slab', label: 'floor deck', days: 5, match: (e) => e.kind === 'slab' },
  ],
  scaffold: [
    { key: 'std', label: 'standards', days: 1, match: (e) => e.kind === 'tube' && vertical(e) },
    { key: 'hz', label: 'ledgers, transoms, braces', days: 1.5, match: (e) => e.kind === 'tube' && !vertical(e) },
    { key: 'board', label: 'boards', days: 0.5, match: (e) => e.kind === 'slab' },
  ],
};

const LAG: Record<BuildingSpec['system'], number> = { 'rc-frame': 3, 'heritage-masonry': 2, scaffold: 0 };

export function planSequence(spec: BuildingSpec, elements: StructuralElement[]): Plan {
  const tasks: Task[] = [];
  let t = 0;

  const base = elements.filter((e) => e.level < 0);
  if (base.length) {
    const existing = spec.system === 'scaffold';
    tasks.push({
      id: 'T-base',
      name: existing ? 'Existing façade (retained)' : 'Foundations',
      start: 0,
      finish: existing ? 0.001 : 10,
      elementIds: base.map((e) => e.id),
    });
    t = existing ? 0 : 10;
  }

  const levels = [...new Set(elements.filter((e) => e.level >= 0).map((e) => e.level))].sort((a, b) => a - b);
  for (const L of levels) {
    const onLevel = elements.filter((e) => e.level === L);
    for (const ph of PHASES[spec.system]) {
      const ids = onLevel.filter(ph.match).map((e) => e.id);
      if (!ids.length) continue;
      tasks.push({ id: `T-${L}-${ph.key}`, name: `${levelName(L, spec.levelNames)} · ${ph.label}`, start: t, finish: t + ph.days, elementIds: ids });
      t += ph.days;
    }
    t += LAG[spec.system];
  }

  const windowOf = new Map<string, { start: number; finish: number }>();
  for (const task of tasks) for (const id of task.elementIds) windowOf.set(id, { start: task.start, finish: task.finish });
  // anything a phase did not claim appears with its storey's last task
  for (const e of elements) if (!windowOf.has(e.id)) windowOf.set(e.id, { start: t, finish: t });
  return { tasks, windowOf, total: Math.max(t, 1) };
}

export function activeTask(plan: Plan, day: number): Task | undefined {
  return plan.tasks.find((k) => day >= k.start && day < k.finish) ?? [...plan.tasks].reverse().find((k) => day >= k.finish);
}
