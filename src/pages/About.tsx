import { Link } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import { profile } from '../data/profile';
import { FadeUp, LineReveal } from '../components/ui/Motion';
import { Pending, RuleList } from '../components/ui/Section';
import { Seo } from '../components/Seo';
import { useExperience, useExpertise, useLocalePath, useProfile, useSoftware, useT } from '../i18n';

function Block({ index, label, id, children }: { index: string; label: string; id: string; children: React.ReactNode }) {
  return (
    <section className="wrap" aria-labelledby={id}>
      <div className="grid gap-6 border-t border-white/[0.08] py-16 md:grid-cols-[12rem_minmax(0,1fr)] md:py-20">
        <h2 id={id} className="label pt-2">
          <span className="text-sand">{index}</span> / {label}
        </h2>
        <div>{children}</div>
      </div>
    </section>
  );
}

export function About() {
  const t = useT();
  const lp = useLocalePath();
  const p = useProfile();
  const jobs = useExperience();
  const expertise = useExpertise();
  const software = useSoftware();

  return (
    <>
      <Seo title={t.seo.about.title} description={t.seo.about.description} type="profile" />
      <section className="wrap pb-20 pt-[calc(var(--header-h)+72px)] sm:pt-[calc(var(--header-h)+112px)]">
        <p className="label mb-8">
          <span className="text-sand">{p.location}</span> / {t.about.label}
        </p>
        <LineReveal lines={[t.about.lineA, <span key="2" className="text-bone-mute">{t.about.lineB}</span>]} className="display h-xl" />
        <FadeUp delay={0.3} className="mt-16 grid gap-12 md:grid-cols-[12rem_minmax(0,1fr)]">
          <ul className="flex flex-col gap-2 pt-2">
            {p.titles.map((x) => (
              <li key={x} className="label text-bone-dim">
                {x}
              </li>
            ))}
          </ul>
          <div className="max-w-[64ch]">
            <p className="lede">{p.introduction}</p>
            <div className="mt-10 flex flex-col gap-6 text-[17px] leading-relaxed text-bone-dim">
              {p.about.paragraphs.map((x) => (
                <p key={x.slice(0, 24)}>{x}</p>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a href={profile.cvUrl} download className="btn-solid">
                <Download className="h-4 w-4" /> {t.common.downloadCv}
              </a>
              <Link to={lp('/cv')} className="btn-ghost">
                <FileText className="h-4 w-4" /> {t.common.viewCv}
              </Link>
            </div>
            <div className="mt-10">
              <Pending items={profile.pending} />
            </div>
          </div>
        </FadeUp>
      </section>

      <Block index="01" label={t.about.focus} id="focus">
        <ul className="flex flex-col">
          {p.about.interests.map((x, i) => (
            <li key={x} className="group flex items-baseline gap-6 border-b border-white/[0.07] py-5">
              <span className="font-mono text-[12px] text-sand">{String(i + 1).padStart(2, '0')}</span>
              <span className="display text-[clamp(22px,2.8vw,40px)] transition-colors duration-500 group-hover:text-sand">{x}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block index="02" label={t.about.experience} id="exp">
        <ol className="flex flex-col gap-16">
          {jobs.map((j) => (
            <li key={j.id} className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
              <div>
                <p className="label mb-4 text-sand">
                  {j.startDate} – {j.current ? t.common.present : j.endDate}
                </p>
                <h3 className="display h-md">{j.position}</h3>
                <p className="mt-4 text-[16px] text-bone">{j.company}</p>
                <p className="mt-1 text-[14px] text-bone-mute">{j.location}</p>
                {j.project && <p className="mt-4 text-[15px] text-bone-dim">{j.project}</p>}
                {j.technologies && (
                  <div className="mt-6 flex flex-wrap gap-2" lang="en">
                    {j.technologies.map((x) => (
                      <span key={x} className="chip pointer-events-none">
                        {x}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <RuleList items={j.responsibilities} dense />
            </li>
          ))}
        </ol>
      </Block>

      <Block index="03" label={t.about.expertise} id="expertise">
        <div className="grid gap-12 sm:grid-cols-2">
          {expertise.map((g) => (
            <div key={g.id}>
              <h3 className="mb-4 text-[18px] font-medium text-bone">{g.title}</h3>
              <RuleList items={g.items} dense />
            </div>
          ))}
        </div>
      </Block>

      <div className="pb-24 sm:pb-32">
        <Block index="04" label={t.about.software} id="software">
          <dl className="grid gap-x-10 sm:grid-cols-2">
            {software.map((s) => (
              <div key={s.name} className="border-t border-white/[0.07] py-4">
                <dt className="text-[17px] font-medium text-bone" lang="en">
                  {s.name}
                </dt>
                <dd className="mt-1 text-[14px] text-bone-mute">{s.use}</dd>
              </div>
            ))}
          </dl>
        </Block>
      </div>
    </>
  );
}
