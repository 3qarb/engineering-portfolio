import { useState } from 'react';
import { tally, type RuleResult, type Severity } from '../../lib/import/checks';
import { useLang } from '../../i18n';
import { useTools } from '../../i18n/tools';
import { cn } from '../../utils/cn';

const TONE: Record<Severity, string> = { fail: 'text-[#e07a5f] border-[#e07a5f]/40', warn: 'text-sand border-sand/40', info: 'text-bone-dim border-white/15' };
const RANK: Record<Severity, number> = { fail: 0, warn: 1, info: 2 };
const SHOW = 6;

function Rule({ r }: { r: RuleResult }) {
  const t = useTools().importer.checker;
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const sorted = [...r.findings].sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  const shown = open ? sorted : sorted.slice(0, SHOW);
  const worst = sorted[0]?.severity;
  return (
    <li className="border-b border-white/[0.07] py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-[16px] text-bone">{r.title[lang]}</p>
        <p className="font-mono text-[12px] text-bone-mute" dir="ltr">
          {r.clause}
        </p>
      </div>
      <p className={cn('label mt-2', worst ? TONE[worst].split(' ')[0] : 'text-bone-dim')}>{sorted.length ? `${t.checked(r.checked)} · ${sorted.length} ${t[worst!]}` : t.allPass(r.checked)}</p>
      {shown.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {shown.map((f, i) => (
            <li key={f.subject + i} className="flex gap-3 text-[14px] leading-snug">
              <span className={cn('label h-fit shrink-0 border px-1.5 py-0.5', TONE[f.severity])}>{t[f.severity]}</span>
              <span className="text-bone-dim">
                <span className="font-mono text-[12px] text-bone" dir="ltr">
                  {f.subject}
                </span>{' '}
                {f.detail[lang]}
              </span>
            </li>
          ))}
        </ul>
      )}
      {sorted.length > SHOW && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="label mt-3 min-h-[40px] text-sand hover:text-bone">
          {open ? '−' : t.more(sorted.length - SHOW)}
        </button>
      )}
    </li>
  );
}

/** Agent 2: rule checks against ACI 318-19 and SBC 201, worst first. */
export function CheckerReport({ rules: all }: { rules: RuleResult[] }) {
  const t = useTools().importer.checker;
  // rules with nothing of their kind in the model are left out
  const rules = all.filter((r) => r.checked > 0 || r.findings.length > 0);
  const n = tally(rules);
  const order = [...rules].sort((a, b) => Math.min(3, ...a.findings.map((f) => RANK[f.severity])) - Math.min(3, ...b.findings.map((f) => RANK[f.severity])));
  return (
    <div>
      <p className="max-w-[66ch] text-[15px] text-bone-dim">{t.note}</p>
      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden border border-white/[0.08] bg-white/[0.08] sm:grid-cols-4">
        {(
          [
            [t.rules(n.rules, n.checked), n.checked, 'text-bone'],
            [t.fail, n.fail, n.fail ? 'text-[#e07a5f]' : 'text-bone'],
            [t.warn, n.warn, n.warn ? 'text-sand' : 'text-bone'],
            [t.info, n.info, 'text-bone'],
          ] as const
        ).map(([k, v, c]) => (
          <div key={k} className="bg-ink-950 p-4">
            <dt className="label">{k}</dt>
            <dd className={cn('mt-2 font-mono text-[24px]', c)}>{v}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-4">
        {order.map((r) => (
          <Rule key={r.id} r={r} />
        ))}
      </ul>
    </div>
  );
}
