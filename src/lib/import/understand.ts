// Agent 1 — Reader: understands the project from its model before anything is drawn or checked.
import type { T2 } from '../../data/elements/types';
import type { ImportedModelJson } from '../structure/imported';
import type { StructuralElement } from '../structure/types';
import type { ConvertResult } from './convert';

export interface ProjectBrief {
  program: string;
  units: string;
  code?: string;
  title?: string;
  stories: { name: string; z: number; height: number }[];
  height: number;
  footprint: { w: number; d: number };
  /** Members per element type (library id) */
  counts: { typeId: string; count: number }[];
  materials: { fc?: number; fy?: number };
  sections: { name: string; use: string; count: number }[];
  loads: ImportedModelJson['loads'];
  patterns: { name: string; type?: string }[];
  seismic: { name: string; coeff?: number }[];
  wind: { name: string; code?: string; speed?: number }[];
  combos: number;
  supports: number;
  hasFoundation: boolean;
  system: T2;
  notes: T2[];
}

const t2 = (en: string, ar: string): T2 => ({ en, ar });

export function understand(conv: ConvertResult, elements: StructuralElement[], bounds: { w: number; d: number; h: number }): ProjectBrief {
  const { json, et, skipped } = conv;
  const counts = new Map<string, number>();
  for (const e of elements) if (e.typeId) counts.set(e.typeId, (counts.get(e.typeId) ?? 0) + 1);
  const has = (id: string) => (counts.get(id) ?? 0) > 0;

  const secCount = new Map<string, { use: string; count: number }>();
  for (const c of json.columns) secCount.set(c[4], { use: 'Column', count: (secCount.get(c[4])?.count ?? 0) + 1 });
  for (const b of json.beams) secCount.set(b[6], { use: 'Beam', count: (secCount.get(b[6])?.count ?? 0) + 1 });
  for (const s of json.slabs) secCount.set(s[2], { use: 'Slab', count: (secCount.get(s[2])?.count ?? 0) + 1 });
  for (const w of json.walls ?? []) secCount.set(w[2], { use: 'Wall', count: (secCount.get(w[2])?.count ?? 0) + 1 });
  for (const i of json.inclined ?? []) secCount.set(i[2], { use: 'Ramp / stair', count: (secCount.get(i[2])?.count ?? 0) + 1 });

  // structural system in words
  const floor = has('ribbed-slab')
    ? t2('ribbed (hollow-block) slabs', 'بلاطات هوردي')
    : has('waffle-slab')
      ? t2('waffle slabs', 'بلاطات وافل')
      : has('flat-slab')
        ? t2('flat slabs on columns', 'بلاطات مسطحة على الأعمدة')
        : t2('solid slabs', 'بلاطات مصمتة');
  const lateral = has('rc-wall') && has('dropped-beam') ? t2('frame with RC walls (dual system)', 'إطار مع جدران خرسانية (نظام مزدوج)') : has('rc-wall') ? t2('RC walls', 'جدران خرسانية') : t2('moment frame', 'إطار مقاوم للعزوم');
  const hidden = has('hidden-beam') ? t2(' and hidden beams', ' وكمرات مخفية') : t2('', '');
  const found = has('raft')
    ? t2('raft foundation', 'لبشة')
    : has('isolated-footing') || has('strip-footing')
      ? t2(`${has('strip-footing') ? 'isolated and strip footings' : 'isolated footings'}${has('strap-beam') ? ' with strap beams' : ''}`, `${has('strip-footing') ? 'قواعد منفصلة وشريطية' : 'قواعد منفصلة'}${has('strap-beam') ? ' مع كمرات شداد' : ''}`)
      : t2('foundation not in the files', 'الأساسات غير موجودة في الملفات');
  const system = t2(
    `Reinforced-concrete ${lateral.en}, ${floor.en}${hidden.en}; ${found.en}.`,
    `منشأ خرساني مسلح: ${lateral.ar}، ${floor.ar}${hidden.ar}؛ ${found.ar}.`,
  );

  const notes: T2[] = [];
  for (const s of skipped) notes.push(t2(`Not drawn: ${s.what} — ${s.count}.`, `لم يُرسم: ${s.what} — ${s.count}.`));
  if (!conv.safe) notes.push(t2('No SAFE file: footings and strap beams are not included.', 'لا يوجد ملف SAFE: القواعد وكمرات الشداد غير مضمنة.'));
  notes.push(
    t2(
      'The model file has no beam or slab reinforcement. Bars are taken from column section names where given; elsewhere the ACI 318-19 minimum is used, so rebar quantities are a lower bound.',
      'ملف النموذج لا يحتوي على تسليح الكمرات والبلاطات. يؤخذ تسليح الأعمدة من أسماء المقاطع إن وُجد، وفي غيرها يُستخدم الحد الأدنى في ACI 318-19، لذا فكميات الحديد حد أدنى.',
    ),
  );
  if (has('flat-slab') && json.slabs.some((s) => json.shell[s[2]]?.kind === 'drop'))
    notes.push(t2('Drop panels overlap the slab in the model; their concrete is counted at full depth.', 'السقوط متداخل مع البلاطة في النموذج؛ وتُحسب خرسانته بكامل عمقه.'));

  return {
    program: `${et.program} ${et.version}`.trim(),
    units: et.units,
    code: et.designCode,
    title: et.title || undefined,
    stories: json.levels.slice(1).map((l, i) => ({ name: l.name, z: l.z, height: Math.round((l.z - json.levels[i].z) * 1000) / 1000 })),
    height: bounds.h - (json.levels[0]?.z ?? 0),
    footprint: { w: bounds.w, d: bounds.d },
    counts: [...counts.entries()].map(([typeId, count]) => ({ typeId, count })).sort((a, b) => b.count - a.count),
    materials: json.materials ?? {},
    sections: [...secCount.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => a.use.localeCompare(b.use) || b.count - a.count),
    loads: json.loads,
    patterns: et.patterns,
    seismic: et.seismic.map((s) => ({ name: s.name, coeff: s.coeff })),
    wind: et.wind.map((w) => ({ name: w.name, code: w.code, speed: w.speed })),
    combos: Object.keys(et.combos).length,
    supports: et.restraints,
    hasFoundation: !!conv.safe,
    system,
    notes,
  };
}
