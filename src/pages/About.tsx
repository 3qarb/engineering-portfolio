import { Download } from 'lucide-react';
import { profile } from '../data/profile';
import { experience } from '../data/experience';
import { skillCategories } from '../data/skills';
import { FadeUp, LineReveal } from '../components/ui/Motion';

/** Entries still holding template text like "[Previous Company Name]" are left out. */
const isFilled = (s: string) => !/^\[.*\]$/.test(s.trim());

export function About() {
  const jobs = experience.filter((e) => isFilled(e.company) && isFilled(e.position));

  return (
    <>
      <section className="wrap pb-20 pt-[calc(var(--header-h)+72px)] sm:pt-[calc(var(--header-h)+112px)]">
        <p className="label mb-8">
          <span className="text-sand">{profile.location}</span> / About
        </p>
        <LineReveal
          lines={['Engineer', <span key="2">of the <span className="serif-accent">existing</span></span>]}
          className="display h-xl"
        />
        <FadeUp delay={0.35} className="mt-16 grid gap-12 md:grid-cols-[12rem_minmax(0,1fr)]">
          <p className="label pt-2">{profile.title.split('|')[0]}</p>
          <div className="max-w-[62ch]">
            <p className="lede">{profile.introduction}</p>
            <div className="mt-10 flex flex-col gap-6 text-[17px] leading-relaxed text-bone-dim">
              {profile.about.paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <a href={profile.cvUrl} download className="btn-solid mt-10">
              <Download className="h-4 w-4" /> Download CV
            </a>
          </div>
        </FadeUp>
      </section>

      <section className="wrap pb-20" aria-labelledby="focus">
        <div className="grid gap-6 border-t border-white/[0.08] py-16 md:grid-cols-[12rem_minmax(0,1fr)]">
          <p id="focus" className="label pt-2">
            <span className="text-sand">01</span> / Focus
          </p>
          <ul className="flex flex-col">
            {profile.about.interests.map((x, i) => (
              <li key={x} className="group flex items-baseline gap-6 border-b border-white/[0.07] py-5">
                <span className="font-mono text-[12px] text-sand">{String(i + 1).padStart(2, '0')}</span>
                <span className="display text-[clamp(24px,3vw,44px)] transition-[color,transform] duration-500 group-hover:translate-x-2 group-hover:text-sand">
                  {x}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap pb-20" aria-labelledby="exp">
        <div className="grid gap-6 border-t border-white/[0.08] py-16 md:grid-cols-[12rem_minmax(0,1fr)]">
          <p id="exp" className="label pt-2">
            <span className="text-sand">02</span> / Experience
          </p>
          <ol className="flex flex-col gap-16">
            {jobs.map((j) => (
              <li key={j.id} className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
                <div>
                  <p className="label mb-4 text-sand">
                    {j.startDate} – {j.endDate}
                  </p>
                  <h2 className="display h-md">{j.position}</h2>
                  <p className="mt-4 text-[16px] text-bone">{j.company}</p>
                  {j.project && <p className="mt-2 text-[15px] text-bone-mute">{j.project}</p>}
                  {j.technologies && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {j.technologies.map((t) => (
                        <span key={t} className="chip">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ul className="flex flex-col">
                  {j.responsibilities.map((r) => (
                    <li key={r} className="flex gap-4 border-t border-white/[0.07] py-3.5 text-[15px] leading-snug text-bone-dim">
                      <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-sand" />
                      {r}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wrap pb-28 sm:pb-40" aria-labelledby="skills">
        <div className="grid gap-6 border-t border-white/[0.08] py-16 md:grid-cols-[12rem_minmax(0,1fr)]">
          <p id="skills" className="label pt-2">
            <span className="text-sand">03</span> / Skills
          </p>
          <div className="grid gap-12 lg:grid-cols-3">
            {skillCategories.map((c) => (
              <div key={c.id}>
                <h3 className="label mb-6 text-bone">{c.title}</h3>
                <ul className="flex flex-col">
                  {c.skills.map((s) => (
                    <li key={s.name} className="border-t border-white/[0.07] py-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[16px] text-bone">{s.name}</span>
                        <span className="label">{s.level}</span>
                      </div>
                      {s.description && <p className="mt-1.5 text-[13px] leading-snug text-bone-mute">{s.description}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
