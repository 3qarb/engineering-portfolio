import { Link } from 'react-router-dom';
import { ArrowRight, Box } from 'lucide-react';
import { Hero } from '../components/home/Hero';
import { WorkList } from '../components/home/WorkList';
import { Marquee, ScrollFillText } from '../components/ui/Motion';
import { useAllProjects } from '../store/projectsStore';
import { buildings } from '../data/buildings';
import { elementsFor } from '../lib/structure/generate';
import { skillCategories } from '../data/skills';
import { experience } from '../data/experience';

const DISCIPLINES = [
  'Structural analysis',
  'Heritage restoration',
  'Technical office',
  'Shop drawings',
  'Temporary works',
  'Strengthening',
];

function SectionHead({ index, label, title }: { index: string; label: string; title: React.ReactNode }) {
  return (
    <div className="mb-14 grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)]">
      <p className="label pt-3">
        <span className="text-sand">{index}</span> / {label}
      </p>
      <h2 className="display h-lg">{title}</h2>
    </div>
  );
}

export function Index() {
  const projects = useAllProjects();
  const office = buildings.find((b) => b.id === 'rc-office-block')!;
  const role = experience.find((e) => e.current);

  return (
    <>
      <Hero />

      <Marquee items={DISCIPLINES} className="border-y border-white/[0.08] py-5 font-mono text-[13px] uppercase tracking-[0.14em] text-bone-dim" />

      {/* Statement */}
      <section className="wrap py-28 sm:py-40" aria-label="Approach">
        <p className="label mb-10">
          <span className="text-sand">01</span> / Approach
        </p>
        <ScrollFillText
          className="max-w-[24ch] font-display text-[clamp(32px,5.2vw,84px)] font-medium uppercase leading-[0.98] tracking-[-0.01em] [font-stretch:80%]"
          text="I work where engineering meets memory: coral-stone walls, reinforced concrete and the temporary works that hold a façade while it is saved."
        />
      </section>

      {/* Work */}
      <section className="wrap pb-28 sm:pb-40" aria-labelledby="work-title">
        <SectionHead
          index="02"
          label="Selected work"
          title={
            <span id="work-title">
              Projects <span className="serif-accent">&amp; structures</span>
            </span>
          }
        />
        <WorkList projects={projects.slice(0, 6)} />
        <div className="mt-10 flex justify-end">
          <Link to="/projects" className="btn-ghost">
            All projects <ArrowRight className="btn-arrow h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Explorer teaser */}
      <section className="border-y border-white/[0.08] bg-ink-900" aria-labelledby="explore-title">
        <div className="wrap grid items-center gap-12 py-24 sm:py-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div>
            <p className="label mb-8">
              <span className="text-sand">03</span> / Interactive
            </p>
            <h2 id="explore-title" className="display h-lg">
              Open the <span className="serif-accent">buildings</span>
            </h2>
            <p className="mt-8 max-w-[44ch] text-[17px] leading-relaxed text-bone-dim">
              Click a building to see what I was responsible for on it. Click a column to read its size, then open its
              section: bars, ties, cover and concrete grade, drawn to the numbers.
            </p>
            <Link to="/explorer" className="btn-solid mt-10">
              <Box className="h-4 w-4" /> Open the 3D explorer
            </Link>
          </div>
          <Link
            to="/explorer"
            className="group relative block aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-ink-950 transition-colors duration-500 hover:border-sand/60"
            aria-label="Open the 3D explorer"
          >
            <img
              src={`/renders/${office.id}.jpg`}
              alt="Rendered 3D model of the eight-storey RC office block"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <span className="absolute left-6 top-6 rounded-full border border-sand/50 bg-ink-950/80 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-sand">
              Column C2 · 500×700 · 16T25
            </span>
            <span className="label absolute bottom-6 right-6 text-bone">{office.floors} storeys · {elementsFor(office).length} members</span>
          </Link>
        </div>
      </section>

      {/* Expertise */}
      <section className="wrap py-28 sm:py-40" aria-labelledby="skills-title">
        <SectionHead
          index="04"
          label="Expertise"
          title={
            <span id="skills-title">
              Tools <span className="serif-accent">&amp; disciplines</span>
            </span>
          }
        />
        <div className="grid gap-px overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.08] md:grid-cols-3">
          {skillCategories.map((c) => (
            <div key={c.id} className="bg-ink-950 p-8 sm:p-10">
              <p className="label mb-8 text-sand">{c.title}</p>
              <ul className="flex flex-col">
                {c.skills.slice(0, 6).map((s) => (
                  <li key={s.name} className="group flex items-baseline justify-between gap-4 border-t border-white/[0.07] py-3">
                    <span className="text-[16px] text-bone transition-colors group-hover:text-sand">{s.name}</span>
                    <span className="label">{s.level}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Current role */}
      {role && (
        <section className="wrap pb-28 sm:pb-40" aria-labelledby="role-title">
          <SectionHead
            index="05"
            label="Now"
            title={
              <span id="role-title">
                {role.position}
              </span>
            }
          />
          <div className="grid gap-10 md:grid-cols-[12rem_minmax(0,1fr)]">
            <dl className="flex flex-col gap-5">
              <div>
                <dt className="label mb-1">Company</dt>
                <dd className="text-[15px] text-bone">{role.company}</dd>
              </div>
              <div>
                <dt className="label mb-1">Since</dt>
                <dd className="text-[15px] text-bone">{role.startDate}</dd>
              </div>
              {role.client && (
                <div>
                  <dt className="label mb-1">Client</dt>
                  <dd className="text-[15px] text-bone">{role.client}</dd>
                </div>
              )}
            </dl>
            <div>
              {role.project && <p className="lede mb-10 max-w-[38ch]">{role.project}</p>}
              <ul className="grid gap-x-10 sm:grid-cols-2">
                {role.responsibilities.slice(0, 8).map((r) => (
                  <li key={r} className="flex gap-3 border-t border-white/[0.07] py-4 text-[15px] leading-snug text-bone-dim">
                    <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-sand" />
                    {r}
                  </li>
                ))}
              </ul>
              <Link to="/about" className="btn-ghost mt-10">
                Full experience <ArrowRight className="btn-arrow h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
