import type { ReactNode } from 'react';
import { elementType } from '../../data/elements';
import type { ProjectBrief } from '../../lib/import/understand';
import { useLang } from '../../i18n';
import { useTools } from '../../i18n/tools';

const f1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString('en-US');
const list = (v: number[]) => (v.length ? v.map(f1).join(', ') : '');

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-white/[0.07] py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6">
      <dt className="label">{k}</dt>
      <dd className="text-[15px] text-bone">{children}</dd>
    </div>
  );
}

/** Agent 1: what the project is, in words and numbers. */
export function ReaderReport({ brief }: { brief: ProjectBrief }) {
  const t = useTools().importer.reader;
  const lang = useLang();
  const none = <span className="text-bone-mute">{t.none}</span>;
  return (
    <div className="flex flex-col gap-10">
      <p className="lede max-w-[66ch]">{brief.system[lang]}</p>

      <dl>
        <Row k={t.program}>{brief.program}</Row>
        <Row k={t.code}>{brief.code ?? none}</Row>
        <Row k={t.units}>
          <span dir="ltr">{brief.units}</span>
        </Row>
        <Row k={t.footprint}>
          <span dir="ltr">
            {f1(brief.footprint.w)} × {f1(brief.footprint.d)} m · {t.height} {f1(brief.height)} m
          </span>
        </Row>
        <Row k={t.materials}>
          <span dir="ltr">
            {brief.materials.fc ? `f′c ${f1(brief.materials.fc)} MPa` : '—'} · {brief.materials.fy ? `fy ${f1(brief.materials.fy)} MPa` : '—'}
          </span>
        </Row>
        <Row k={t.stories}>
          <span dir="ltr" className="font-mono text-[13px]">
            {brief.stories.map((s) => `${s.name} ${f1(s.z)} m`).join(' · ') || '—'}
          </span>
        </Row>
      </dl>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h3 className="label mb-3 text-sand">{t.members}</h3>
          <ul>
            {brief.counts.map((c) => (
              <li key={c.typeId} className="flex justify-between gap-4 border-b border-white/[0.07] py-2.5 text-[15px]">
                <span className="text-bone-dim">{elementType(c.typeId)?.name[lang] ?? c.typeId}</span>
                <span className="font-mono text-bone">{c.count}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="label mb-3 text-sand">{t.loads}</h3>
          <dl dir="ltr">
            {(
              [
                [t.superDead, list(brief.loads.superDeadKPa), 'kPa'],
                [t.live, list(brief.loads.liveKPa), 'kPa'],
                [t.wallLines, list(brief.loads.wallLinesKNm), 'kN/m'],
              ] as const
            ).map(([k, v, u]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-white/[0.07] py-2.5 text-[15px]">
                <dt className="text-bone-dim">{k}</dt>
                <dd className="text-end font-mono text-bone">{v ? `${v} ${u}` : '—'}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-b border-white/[0.07] py-2.5 text-[15px]">
              <dt className="text-bone-dim">{t.lateral}</dt>
              <dd className="text-end font-mono text-bone">{[...brief.seismic, ...brief.wind].map((p) => p.name).join(', ') || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/[0.07] py-2.5 text-[15px]">
              <dt className="text-bone-dim">{t.combos}</dt>
              <dd className="font-mono text-bone">{brief.combos}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section>
        <h3 className="label mb-3 text-sand">{t.sections}</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-start text-[14px]" dir="ltr">
            <tbody>
              {brief.sections.map((s) => (
                <tr key={s.use + s.name} className="border-b border-white/[0.07]">
                  <td className="py-2 pe-4 font-mono text-bone">{s.name}</td>
                  <td className="py-2 pe-4 text-bone-dim">{s.use}</td>
                  <td className="py-2 text-end font-mono text-bone">{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {brief.notes.length > 0 && (
        <section>
          <h3 className="label mb-3 text-sand">{t.notes}</h3>
          <ul className="flex list-disc flex-col gap-2 ps-5 text-[15px] text-bone-dim">
            {brief.notes.map((n) => (
              <li key={n.en}>{n[lang]}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
