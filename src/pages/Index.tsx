import { Link } from 'react-router-dom';
import { ArrowRight, Box, Download } from 'lucide-react';
import { Hero } from '../components/home/Hero';
import { WorkList } from '../components/home/WorkList';
import { ScrollFillText } from '../components/ui/Motion';
import { SectionHead } from '../components/ui/Section';
import { Seo } from '../components/Seo';
import { SITE_URL } from '../lib/site';
import { useAllProjects } from '../store/projectsStore';
import { buildings } from '../data/buildings';
import { profile } from '../data/profile';
import { elementsFor } from '../lib/structure/generate';
import { useExperience, useExpertise, useLocalePath, useLocalized, useProfile, useSoftware, useT } from '../i18n';

function personJsonLd() {
  const same = profile.links.linkedin.verified ? [profile.links.linkedin.url] : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.titles,
    worksFor: { '@type': 'Organization', name: profile.currentCompany.name },
    address: { '@type': 'PostalAddress', addressLocality: 'Jeddah', addressCountry: 'SA' },
    knowsAbout: ['Structural engineering', 'Technical office engineering', 'Historic building restoration', 'Temporary works'],
    ...(SITE_URL ? { url: SITE_URL } : {}),
    ...(same ? { sameAs: same } : {}),
  };
}

export function Index() {
  const t = useT();
  const lp = useLocalePath();
  const p = useProfile();
  const projects = useLocalized(useAllProjects());
  const expertise = useExpertise();
  const software = useSoftware();
  const role = useExperience().find((e) => e.current);
  const office = buildings.find((b) => b.id === 'rc-office-block')!;

  return (
    <>
      <Seo title={t.seo.home.title} description={t.seo.home.description} type="profile" jsonLd={personJsonLd()} />
      <Hero />

      {/* 01 Profile */}
      <section className="wrap py-28 sm:py-36" aria-labelledby="profile-title">
        <p className="label mb-10">
          <span className="text-sand">01</span> / <span id="profile-title">{t.home.profile}</span>
        </p>
        <ScrollFillText
          className="max-w-[26ch] text-[clamp(28px,4.4vw,68px)] font-medium leading-[1.04] tracking-[-0.03em]"
          text={t.home.statement}
        />
        <div className="mt-14 grid gap-8 md:grid-cols-[12rem_minmax(0,1fr)]">
          <span aria-hidden="true" />
          <div className="max-w-[60ch]">
            <p className="text-[17px] leading-relaxed text-bone-dim">{p.about.paragraphs[1]}</p>
            <Link to={lp('/about')} className="btn-ghost mt-8">
              {t.home.readProfile} <ArrowRight className="btn-arrow h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 02 Work */}
      <section className="wrap pb-28 sm:pb-36" aria-labelledby="work-title">
        <SectionHead
          index="02"
          label={t.home.work}
          id="work-title"
          title={
            <>
              {t.home.workTitle} <span className="text-bone-mute">{t.home.workTitleB}</span>
            </>
          }
        />
        <WorkList projects={projects.slice(0, 6)} />
        <div className="mt-10 flex justify-end">
          <Link to={lp('/projects')} className="btn-ghost">
            {t.common.allProjects} <ArrowRight className="btn-arrow h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 03 Expertise */}
      <section className="border-y border-white/[0.08] bg-ink-900" aria-labelledby="expertise-title">
        <div className="wrap py-28 sm:py-36">
          <SectionHead
            index="03"
            label={t.home.expertise}
            id="expertise-title"
            title={
              <>
                {t.home.expertiseTitle} <span className="text-bone-mute">{t.home.expertiseTitleB}</span>
              </>
            }
          />
          <div className="grid gap-px border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 xl:grid-cols-4">
            {expertise.map((g, i) => (
              <div key={g.id} className="bg-ink-900 p-7 sm:p-8">
                <p className="mb-8 flex items-baseline gap-3">
                  <span className="font-mono text-[12px] text-sand">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[19px] font-medium tracking-[-0.01em] text-bone">{g.title}</span>
                </p>
                <ul className="flex flex-col">
                  {g.items.map((s) => (
                    <li key={s} className="border-t border-white/[0.07] py-3 text-[15px] leading-snug text-bone-dim">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04 Experience */}
      {role && (
        <section className="wrap py-28 sm:py-36" aria-labelledby="role-title">
          <SectionHead index="04" label={t.home.experience} id="role-title" title={role.position} />
          <div className="grid gap-10 md:grid-cols-[12rem_minmax(0,1fr)]">
            <dl className="flex flex-col gap-5">
              <div>
                <dt className="label mb-1.5">{t.home.company}</dt>
                <dd className="text-[15px] text-bone">{role.company}</dd>
              </div>
              <div>
                <dt className="label mb-1.5">{t.home.since}</dt>
                <dd className="font-mono text-[15px] text-bone">
                  {role.startDate} – {t.common.present}
                </dd>
              </div>
              <div>
                <dt className="label mb-1.5">{role.location ? t.cv.location : ''}</dt>
                <dd className="text-[15px] text-bone">{role.location}</dd>
              </div>
            </dl>
            <div>
              {role.project && <p className="lede mb-4 max-w-[34ch]">{role.project}</p>}
              {role.summary && <p className="mb-10 max-w-[58ch] text-[16px] leading-relaxed text-bone-dim">{role.summary}</p>}
              <ul className="grid gap-x-10 sm:grid-cols-2">
                {role.responsibilities.slice(0, 8).map((r) => (
                  <li key={r} className="flex gap-3 border-t border-white/[0.07] py-4 text-[15px] leading-snug text-bone-dim">
                    <span className="mt-[8px] h-1 w-1 shrink-0 bg-sand" aria-hidden="true" />
                    {r}
                  </li>
                ))}
              </ul>
              <Link to={lp('/about')} className="btn-ghost mt-10">
                {t.home.fullExperience} <ArrowRight className="btn-arrow h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 05 Explorer */}
      <section className="border-y border-white/[0.08] bg-ink-900" aria-labelledby="explore-title">
        <div className="wrap grid items-center gap-12 py-24 sm:py-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div>
            <p className="label mb-8">
              <span className="text-sand">05</span> / {t.home.interactive}
            </p>
            <h2 id="explore-title" className="display h-lg">
              {t.home.explorerTitle} <span className="text-bone-mute">{t.home.explorerTitleB}</span>
            </h2>
            <p className="mt-8 max-w-[46ch] text-[17px] leading-relaxed text-bone-dim">{t.home.explorerBody}</p>
            <Link to={lp('/explorer')} className="btn-solid mt-10">
              <Box className="h-4 w-4" /> {t.common.openExplorer}
            </Link>
          </div>
          <Link
            to={lp('/explorer')}
            className="group relative block aspect-[4/3] overflow-hidden border border-white/10 bg-ink-950 transition-colors duration-500 hover:border-sand/60"
            aria-label={t.common.openExplorer}
          >
            <img
              src={`/renders/${office.id}.jpg`}
              alt="Rendered 3D model of an eight-storey reinforced concrete frame"
              loading="lazy"
              decoding="async"
              width={1600}
              height={1200}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <span className="absolute start-5 top-5 border border-sand/50 bg-ink-950/85 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-sand" dir="ltr">
              {t.home.explorerTag}
            </span>
            <span className="label absolute bottom-5 end-5 text-bone" dir="ltr">
              {office.floors} storeys · {elementsFor(office).length} members
            </span>
          </Link>
        </div>
      </section>

      {/* 06 Software */}
      <section className="wrap py-28 sm:py-36" aria-labelledby="software-title">
        <SectionHead
          index="06"
          label={t.home.software}
          id="software-title"
          title={
            <>
              {t.home.softwareTitle} <span className="text-bone-mute">{t.home.softwareTitleB}</span>
            </>
          }
        />
        <ul className="border-b border-white/[0.08] md:ms-[calc(12rem+1.25rem)]">
          {software.map((s) => (
            <li key={s.name} className="grid gap-2 border-t border-white/[0.08] py-6 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:items-baseline sm:gap-8">
              <span className="text-[clamp(24px,2.6vw,36px)] font-medium tracking-[-0.02em] text-bone" lang="en">
                {s.name}
              </span>
              <span className="text-[15px] text-bone-mute">{s.use}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 07 Contact */}
      <section className="border-t border-white/[0.08]" aria-labelledby="contact-title">
        <div className="wrap py-28 sm:py-36">
          <SectionHead
            index="07"
            label={t.home.contact}
            id="contact-title"
            title={
              <>
                {t.home.contactTitle} <span className="text-bone-mute">{t.home.contactTitleB}</span>
              </>
            }
          />
          <div className="grid gap-8 md:grid-cols-[12rem_minmax(0,1fr)]">
            <span aria-hidden="true" />
            <div>
              <p className="max-w-[48ch] text-[17px] leading-relaxed text-bone-dim">{t.home.contactBody}</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link to={lp('/contact')} className="btn-solid">
                  {t.home.contactCta} <ArrowRight className="btn-arrow h-4 w-4" />
                </Link>
                <a href={profile.cvUrl} download className="btn-ghost">
                  <Download className="h-4 w-4" /> {t.common.downloadCv}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
