// Agent 2 — Checker: geometric and detailing checks against ACI 318-19 and SBC/IBC limits.
// These are rule checks on sizes, spacings and layout. They are not a structural analysis: strength,
// drift and deflection come from the ETABS results.
import type { T2 } from '../../data/elements/types';
import { parseColumnName, type ImportedModelJson } from '../structure/imported';
import { barArea, ribClear } from '../structure/sectionMath';
import type { Section, StructuralElement } from '../structure/types';

export type Severity = 'fail' | 'warn' | 'info';

export interface Finding {
  severity: Severity;
  /** Members concerned (element ids) or a section name */
  subject: string;
  detail: T2;
}

export interface RuleResult {
  id: string;
  clause: string;
  title: T2;
  checked: number;
  findings: Finding[];
}

const t2 = (en: string, ar: string): T2 => ({ en, ar });
const f0 = (v: number) => Math.round(v).toLocaleString('en-US');
const f1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString('en-US');
type Of<K extends Section['kind']> = StructuralElement & { section: Extract<Section, { kind: K }> };
const isKind = <K extends Section['kind']>(k: K) => (e: StructuralElement): e is Of<K> => e.section.kind === k;
const key = (x: number, z: number) => `${Math.round(x * 20)}|${Math.round(z * 20)}`; // 50 mm grid

export function runChecks(json: ImportedModelJson, elements: StructuralElement[], combos: number): RuleResult[] {
  const rules: RuleResult[] = [];
  const rule = (id: string, clause: string, title: T2) => {
    const r: RuleResult = { id, clause, title, checked: 0, findings: [] };
    rules.push(r);
    return r;
  };
  const columns = elements.filter(isKind('rc-column'));
  const sectionOfColumn = new Map(json.columns.map((c) => [`${c[1]}-${c[0]}`, c[4]]));
  const modelBars = (e: StructuralElement) => {
    const n = sectionOfColumn.get(e.id);
    return !!n && (!!parseColumnName(n) || !!json.frames?.[n]?.bars);
  };

  // ── columns ────────────────────────────────────────────────────────────
  const ratio = rule('column-steel', 'ACI 318-19 §10.6.1.1', t2('Column steel between 1 % and 8 %', 'حديد الأعمدة بين 1٪ و 8٪'));
  const bySection = new Map<string, Of<'rc-column'>[]>();
  for (const c of columns.filter(modelBars)) {
    const n = sectionOfColumn.get(c.id)!;
    bySection.set(n, [...(bySection.get(n) ?? []), c]);
  }
  for (const [name, list] of bySection) {
    ratio.checked++;
    const s = list[0].section;
    const ag = s.shape === 'circle' ? (Math.PI * s.b ** 2) / 4 : s.b * s.h;
    const rho = (s.bars.n * barArea(s.bars.dia)) / ag;
    if (rho < 0.01 || rho > 0.08)
      ratio.findings.push({
        severity: 'fail',
        subject: name,
        detail: t2(`${name}: ρ = ${f1(rho * 100)} % (${list.length} members)`, `${name}: ‏ρ = ${f1(rho * 100)}٪ (${list.length} عنصر)`),
      });
  }

  const slender = rule('column-slenderness', 'ACI 318-19 §6.2.5.1', t2('Column slenderness kℓu/r (k = 1, r = 0.3h)', 'نحافة الأعمدة ‎kℓu/r‎ ‏(k = 1، r = 0.3h)'));
  const worst = new Map<string, { lam: number; ids: string[] }>();
  for (const c of columns) {
    slender.checked++;
    const least = c.section.shape === 'circle' ? c.section.b : Math.min(c.section.b, c.section.h);
    const r = c.section.shape === 'circle' ? 0.25 * least : 0.3 * least;
    const lam = (c.length * 1000) / r;
    if (lam <= 22) continue;
    const band = lam > 100 ? 'over100' : 'over22';
    const w = worst.get(band) ?? { lam: 0, ids: [] };
    w.lam = Math.max(w.lam, lam);
    w.ids.push(c.id);
    worst.set(band, w);
  }
  const o22 = worst.get('over22');
  if (o22)
    slender.findings.push({
      severity: 'warn',
      subject: o22.ids.slice(0, 12).join(', ') + (o22.ids.length > 12 ? '…' : ''),
      detail: t2(
        `${o22.ids.length} columns above 22 (up to ${f0(o22.lam)}): slenderness effects apply if the storey can sway — check δ in ETABS (§6.6.4).`,
        `${o22.ids.length} عمود فوق 22 (حتى ${f0(o22.lam)}): تُعتبر النحافة إن كان الدور متحركاً — راجع ‎δ‎ في ETABS ‏(§6.6.4).`,
      ),
    });
  const o100 = worst.get('over100');
  if (o100)
    slender.findings.push({
      severity: 'fail',
      subject: o100.ids.join(', '),
      detail: t2(`${o100.ids.length} columns above 100: needs a nonlinear second-order analysis (§6.2.6).`, `${o100.ids.length} عمود فوق 100: يلزم تحليل لاخطي من الدرجة الثانية (§6.2.6).`),
    });

  // column continuity: a column that starts on a floor with no column under it is planted (transfer)
  const cont = rule('column-continuity', 'Load path', t2('Every column continues to the foundation', 'كل عمود يستمر حتى الأساس'));
  const levels = [...new Set(columns.map((c) => c.level))].sort((a, b) => a - b);
  const at = new Map(levels.map((l) => [l, new Set(columns.filter((c) => c.level === l).map((c) => key(c.position[0], c.position[2])))]));
  for (const c of columns) {
    if (c.level === levels[0]) continue;
    cont.checked++;
    const below = levels[levels.indexOf(c.level) - 1];
    if (!at.get(below)!.has(key(c.position[0], c.position[2])))
      cont.findings.push({
        severity: 'warn',
        subject: c.id,
        detail: t2(`${c.label} (${c.story}) has no column under it: it is carried by a beam or slab (transfer).`, `${c.label} ‏(${c.story}) لا يوجد عمود تحته: محمول على كمرة أو بلاطة (تحويل).`),
      });
  }

  const footings = elements.filter((e) => e.kind === 'footing');
  if (footings.length) {
    const under = rule('column-footing', 'Load path', t2('A footing under every ground column', 'قاعدة تحت كل عمود أرضي'));
    for (const c of columns.filter((x) => x.level === levels[0])) {
      under.checked++;
      const [x, , z] = c.position;
      const inside = footings.some((f) => Math.abs(x - f.position[0]) <= f.size[0] / 2 + 0.05 && Math.abs(z - f.position[2]) <= f.size[2] / 2 + 0.05);
      if (!inside) under.findings.push({ severity: 'warn', subject: c.id, detail: t2(`${c.label}: no footing found under it in the SAFE model.`, `${c.label}: لا توجد قاعدة تحته في نموذج SAFE.`) });
    }
  }

  // ── beams: spans along beam lines, between columns ─────────────────────
  const depth = rule('beam-depth', 'ACI 318-19 Table 9.3.1.1', t2('Beam depth against span', 'عمق الكمرات مقابل البحر'));
  const colAt = new Map<string, Set<string>>();
  for (const c of columns) {
    const s = c.story ?? '';
    if (!colAt.has(s)) colAt.set(s, new Set());
    colAt.get(s)!.add(key(c.position[0], c.position[2]));
  }
  const byStory = new Map<string, ImportedModelJson['beams']>();
  for (const b of json.beams) byStory.set(b[1], [...(byStory.get(b[1]) ?? []), b]);
  const beamEl = new Map(elements.filter((e) => e.kind === 'beam').map((e) => [e.id, e]));
  for (const [story, list] of byStory) {
    const cols = colAt.get(story) ?? new Set<string>();
    const ends = new Map<string, number[]>();
    list.forEach((b, i) => {
      for (const k of [key(b[2], b[3]), key(b[4], b[5])]) ends.set(k, [...(ends.get(k) ?? []), i]);
    });
    const dir = (b: (typeof list)[number]) => {
      const L = Math.hypot(b[4] - b[2], b[5] - b[3]) || 1;
      return [(b[4] - b[2]) / L, (b[5] - b[3]) / L];
    };
    const seen = new Set<number>();
    list.forEach((b0, i0) => {
      if (seen.has(i0)) return;
      // grow a straight chain through joints that have no column
      const chain = [i0];
      seen.add(i0);
      const grow = (from: string) => {
        let node = from;
        let last = i0;
        for (;;) {
          if (cols.has(node)) return { node, supported: true };
          const here = (ends.get(node) ?? []).filter((j) => j !== last);
          const d0 = dir(list[last]);
          const next = here.find((j) => !seen.has(j) && Math.abs(Math.abs(d0[0] * dir(list[j])[0] + d0[1] * dir(list[j])[1]) - 1) < 1e-3);
          if (next === undefined) return { node, supported: here.length > 0 };
          chain.push(next);
          seen.add(next);
          const nb = list[next];
          node = key(nb[2], nb[3]) === node ? key(nb[4], nb[5]) : key(nb[2], nb[3]);
          last = next;
        }
      };
      const a = grow(key(b0[2], b0[3]));
      const b = grow(key(b0[4], b0[5]));
      const span = chain.reduce((s, j) => s + Math.hypot(list[j][4] - list[j][2], list[j][5] - list[j][3]), 0);
      const el = beamEl.get(`${story}-${b0[0]}`);
      if (!el || el.section.kind !== 'rc-beam' || el.typeId === 'ground-beam') return;
      depth.checked++;
      const h = el.section.h / 1000;
      const cantilever = !a.supported || !b.supported;
      const limit = cantilever ? span / 8 : span / 21;
      if (h < limit - 1e-3)
        depth.findings.push({
          severity: 'warn',
          subject: chain.map((j) => `${story}-${list[j][0]}`).join(', '),
          detail: t2(
            `${story} ${chain.map((j) => list[j][0]).join('+')}: h ${f0(h * 1000)} mm on a ${f1(span)} m ${cantilever ? 'cantilever (ℓ/8' : 'span (ℓ/21'} = ${f0(limit * 1000)} mm) — calculate the deflection.`,
            `${story} ${chain.map((j) => list[j][0]).join('+')}: ‏h ${f0(h * 1000)} مم على ${cantilever ? 'كابولي' : 'بحر'} ${f1(span)} م (${cantilever ? 'ℓ/8' : 'ℓ/21'} = ${f0(limit * 1000)} مم) — يلزم حساب الترخيم.`,
          ),
        });
    });
  }

  const asmin = rule('beam-min-steel', 'ACI 318-19 §9.6.1.2', t2('Beam bottom steel ≥ As,min', 'حديد الكمرات السفلي ≥ ‎As,min‎'));
  const fc = json.materials?.fc ?? 28;
  const fy = json.materials?.fy ?? 420;
  const beamSecs = new Map<string, Of<'rc-beam'>>();
  for (const e of elements.filter(isKind('rc-beam'))) if (!e.note?.includes('ACI 318-19 minimum')) beamSecs.set(`${e.section.b}x${e.section.h}|${e.section.bottom.n}T${e.section.bottom.dia}`, e);
  for (const [, e] of beamSecs) {
    asmin.checked++;
    const s = e.section;
    const d = s.h - s.cover - s.stirrups.dia - s.bottom.dia / 2;
    const need = Math.max((0.25 * Math.sqrt(fc)) / fy, 1.4 / fy) * s.b * d;
    const have = s.bottom.n * barArea(s.bottom.dia);
    if (have < need)
      asmin.findings.push({ severity: 'fail', subject: `${s.b}×${s.h}`, detail: t2(`${s.b}×${s.h} with ${s.bottom.n}T${s.bottom.dia}: ${f0(have)} < ${f0(need)} mm²`, `${s.b}×${s.h} مع ${s.bottom.n}T${s.bottom.dia}: ‏${f0(have)} < ${f0(need)} مم²`) });
  }

  // ── slabs ──────────────────────────────────────────────────────────────
  const ribs = rule('ribbed-geometry', 'ACI 318-19 §9.8.1, §9.8.2.1.1, §8.8', t2('Ribbed and waffle slab proportions', 'أبعاد بلاطات الأعصاب والوافل'));
  const ribSecs = new Map<string, Of<'ribbed-slab'>>();
  for (const e of elements.filter(isKind('ribbed-slab'))) ribSecs.set(`${e.section.depth}|${e.section.topping}|${e.section.ribWidth}|${e.section.ribSpacing}|${e.section.ribAxis}`, e);
  for (const [, e] of ribSecs) {
    ribs.checked++;
    const s = e.section;
    const clear = ribClear(s);
    const minTop = Math.max(clear / 12, s.filler === 'void' ? 50 : 40);
    const name = `${s.depth}/${s.topping}, ribs ${s.ribWidth}@${s.ribSpacing}`;
    const bad: string[] = [];
    if (s.ribWidth < 100) bad.push(`rib ${s.ribWidth} < 100 mm`);
    if (s.depth > 3.5 * s.ribWidth) bad.push(`depth ${s.depth} > 3.5 × ${s.ribWidth} = ${f0(3.5 * s.ribWidth)} mm`);
    if (clear > 750) bad.push(`clear spacing ${clear} > 750 mm`);
    if (s.topping < minTop) bad.push(`topping ${s.topping} < ${f0(minTop)} mm`);
    if (bad.length) ribs.findings.push({ severity: 'fail', subject: name, detail: t2(`${name}: ${bad.join('; ')}`, `${name}: ${bad.join('؛ ')}`) });
  }

  const flat = rule('flat-slab-thickness', 'ACI 318-19 Table 8.3.1.1', t2('Flat slab thickness against the column spacing', 'سماكة البلاطة المسطحة مقابل تباعد الأعمدة'));
  const flatEls = elements.filter((e) => e.typeId === 'flat-slab' && e.section.kind === 'rc-slab' && !e.label.startsWith('Drop'));
  const flatStories = new Set(flatEls.map((e) => e.story));
  for (const story of flatStories) {
    const cs = columns.filter((c) => c.story === story);
    // longest clear span between a column and its nearest neighbour on the same grid line
    let ln = 0;
    for (const c of cs) {
      let nx = Infinity;
      let nz = Infinity;
      for (const o of cs) {
        if (o === c) continue;
        const dx = Math.abs(o.position[0] - c.position[0]);
        const dz = Math.abs(o.position[2] - c.position[2]);
        if (dz < 0.3 && dx > 0.5) nx = Math.min(nx, dx - (c.size[0] + o.size[0]) / 2);
        if (dx < 0.3 && dz > 0.5) nz = Math.min(nz, dz - (c.size[2] + o.size[2]) / 2);
      }
      for (const v of [nx, nz]) if (Number.isFinite(v)) ln = Math.max(ln, v);
    }
    if (!ln) continue;
    const drops = elements.some((e) => e.story === story && e.label.startsWith('Drop'));
    const need = Math.max((ln * 1000) / (drops ? 36 : 33), drops ? 100 : 125);
    const t = Math.min(...flatEls.filter((e) => e.story === story).map((e) => (e.section as Extract<Section, { kind: 'rc-slab' }>).t));
    flat.checked++;
    if (t < need)
      flat.findings.push({
        severity: 'warn',
        subject: story ?? '',
        detail: t2(`${story}: t ${f0(t)} mm < ℓn/${drops ? 36 : 33} = ${f0(need)} mm for ℓn ≈ ${f1(ln)} m — calculate the deflection.`, `${story}: ‏t ${f0(t)} مم < ‎ℓn/${drops ? 36 : 33}‎ = ${f0(need)} مم لبحر صافٍ ≈ ${f1(ln)} م — يلزم حساب الترخيم.`),
      });
  }

  // ── walls, stairs, ramps, footings ────────────────────────────────────
  const walls = elements.filter(isKind('rc-wall'));
  if (walls.length) {
    const w = rule('wall-thickness', 'ACI 318-19 Table 11.3.1.1', t2('Wall thickness', 'سماكة الجدران'));
    for (const e of walls) {
      w.checked++;
      const L = Math.max(e.size[0], e.size[2]);
      const need = Math.max(100, (Math.min(L, e.size[1]) * 1000) / 25);
      if (e.section.t < need) w.findings.push({ severity: 'fail', subject: e.id, detail: t2(`${e.label}: ${e.section.t} < ${f0(need)} mm`, `${e.label}: ‏${e.section.t} < ${f0(need)} مم`) });
    }
  }
  const stairs = elements.filter(isKind('stair'));
  if (stairs.length) {
    const st = rule('stair-geometry', 'SBC 201 / IBC §1011.5.2', t2('Riser and tread', 'القائمة والنائمة'));
    for (const e of stairs) {
      st.checked++;
      const { riser, tread } = e.section;
      if (riser > 196 || tread < 254)
        st.findings.push({ severity: 'fail', subject: e.id, detail: t2(`${e.label}: ${riser} / ${tread} mm is outside even the dwelling-unit limits (196 / 254).`, `${e.label}: ‏${riser} / ${tread} مم خارج حدود الوحدات السكنية (196 / 254).`) });
      else if (riser > 178 || tread < 279)
        st.findings.push({ severity: 'info', subject: e.id, detail: t2(`${e.label}: ${riser} / ${tread} mm — allowed inside a dwelling unit only (178 / 279 elsewhere).`, `${e.label}: ‏${riser} / ${tread} مم — مسموح داخل الوحدة السكنية فقط (178 / 279 في غيرها).`) });
    }
  }
  const ramps = elements.filter(isKind('ramp'));
  if (ramps.length) {
    const rp = rule('ramp-slope', 'SBC 201 / IBC §1012.2', t2('Ramp slope', 'ميل المنحدرات'));
    for (const e of ramps) {
      rp.checked++;
      if (e.section.slope > 15)
        rp.findings.push({ severity: 'warn', subject: e.id, detail: t2(`${e.label}: ${f1(e.section.slope)} % — steep for vehicles; check transitions (guidance).`, `${e.label}: ‏${f1(e.section.slope)}٪ — شديد للسيارات؛ راجع المنحدرات الانتقالية (إرشاد).`) });
      else if (e.section.slope > 100 / 12)
        rp.findings.push({ severity: 'info', subject: e.id, detail: t2(`${e.label}: ${f1(e.section.slope)} % — vehicles only; pedestrian ramps need ≤ 8.33 %.`, `${e.label}: ‏${f1(e.section.slope)}٪ — للسيارات فقط؛ منحدرات المشاة ≤ 8.33٪.`) });
    }
  }
  if (footings.length) {
    const fd = rule('footing-depth', 'ACI 318-19 §13.3.1.2', t2('Footing depth above the bottom bars ≥ 150 mm', 'عمق القاعدة فوق الحديد السفلي ≥ 150 مم'));
    for (const e of elements.filter(isKind('rc-footing'))) {
      fd.checked++;
      const d = e.section.t - e.section.cover - e.section.bottom.dia * 2;
      if (d < 150) fd.findings.push({ severity: 'fail', subject: e.id, detail: t2(`${e.label}: ${f0(d)} mm`, `${e.label}: ‏${f0(d)} مم`) });
    }
  }

  // ── model ─────────────────────────────────────────────────────────────
  const model = rule('model', 'Model set-up', t2('Load combinations and materials', 'تركيبات الأحمال والمواد'));
  model.checked += 2;
  if (!combos) model.findings.push({ severity: 'warn', subject: 'combos', detail: t2('No load combinations in the model file.', 'لا توجد تركيبات أحمال في ملف النموذج.') });
  if ((json.materials?.fc ?? 28) < 21)
    model.findings.push({ severity: 'info', subject: 'fc', detail: t2(`f′c ${f1(json.materials!.fc!)} MPa: below 21 MPa, the minimum for special frames and walls (§19.2.1.1).`, `‏f′c ${f1(json.materials!.fc!)} ميجاباسكال: أقل من 21 وهو الحد الأدنى للإطارات والجدران الخاصة (§19.2.1.1).`) });

  return rules;
}

export function tally(rules: RuleResult[]) {
  const all = rules.flatMap((r) => r.findings);
  return {
    rules: rules.length,
    checked: rules.reduce((a, r) => a + r.checked, 0),
    fail: all.filter((f) => f.severity === 'fail').length,
    warn: all.filter((f) => f.severity === 'warn').length,
    info: all.filter((f) => f.severity === 'info').length,
  };
}
