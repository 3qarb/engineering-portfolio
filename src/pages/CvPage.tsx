import { useEffect } from 'react';
import { Download, Printer } from 'lucide-react';
import { profile, isPlaceholder } from '../data/profile';
import { Seo } from '../components/Seo';
import { Pending } from '../components/ui/Section';
import { useDocumentLang } from '../i18n/useDocumentLang';
import { useExperience, useExpertise, useLang, useProfile, useSoftware, useT } from '../i18n';

/**
 * One-page A4 CV built from the same data as the site.
 * /cv shows it with download and print; /cv/print is the bare sheet that
 * scripts/build-cv.sh turns into public/cv.pdf (and /ar/cv/print into public/cv-ar.pdf).
 */
function Sheet() {
  const t = useT();
  const p = useProfile();
  const jobs = useExperience();
  const expertise = useExpertise();
  const software = useSoftware();
  const email = isPlaceholder(profile.email) ? '' : profile.email;
  const phone = isPlaceholder(profile.phone) ? '' : profile.phone;
  const linkedin = profile.links.linkedin.verified ? profile.links.linkedin.url.replace(/^https?:\/\/(www\.)?/, '') : '';

  return (
    <article className="cv-sheet mx-auto bg-[#fbfaf7] text-[#16150f]" aria-label={t.cv.label}>
      <header className="flex items-end justify-between gap-8 border-b-2 border-[#16150f] pb-6">
        <div>
          <h1 className="text-[30px] font-semibold leading-none tracking-[-0.03em]">{p.name}</h1>
          <p className="mt-3 text-[12.5px] text-[#5b564c]">{p.titles.join('  ·  ')}</p>
        </div>
        <svg viewBox="0 0 32 32" className="h-10 w-10 shrink-0" aria-hidden="true">
          <path d="M8 24V9h16v15M8 14h16M16 9v15" fill="none" stroke="#16150f" strokeWidth="1.6" />
          <circle cx="16" cy="14" r="2" fill="#9c7a46" />
        </svg>
      </header>

      <div className="grid grid-cols-[52mm_minmax(0,1fr)] gap-8 pt-6">
        <aside className="flex flex-col gap-6 text-[11px] leading-snug">
          <section>
            <h2 className="cv-h">{t.cv.contact}</h2>
            <ul className="flex flex-col gap-1.5">
              <li>{p.location}</li>
              {email && <li dir="ltr">{email}</li>}
              {phone && <li dir="ltr">{phone}</li>}
              {linkedin && <li dir="ltr">{linkedin}</li>}
            </ul>
          </section>
          <section>
            <h2 className="cv-h">{t.cv.expertise}</h2>
            <div className="flex flex-col gap-3">
              {expertise.map((g) => (
                <div key={g.id}>
                  <p className="mb-1 font-semibold">{g.title}</p>
                  <ul className="flex flex-col gap-0.5 text-[#3d3a33]">
                    {g.items.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="cv-h">{t.cv.software}</h2>
            <ul className="flex flex-col gap-1.5">
              {software.map((s) => (
                <li key={s.name}>
                  <span className="font-semibold" lang="en">
                    {s.name}
                  </span>
                  <span className="block text-[#5b564c]">{s.use}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <div className="flex flex-col gap-6 text-[11.5px] leading-[1.5]">
          <section>
            <h2 className="cv-h">{t.cv.profile}</h2>
            <p className="text-[12.5px] leading-[1.55]">{p.positioning}</p>
            <p className="mt-2 text-[#3d3a33]">{p.about.paragraphs[1]}</p>
          </section>
          <section>
            <h2 className="cv-h">{t.cv.experience}</h2>
            {jobs.map((j) => (
              <div key={j.id} className="break-inside-avoid">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-[13.5px] font-semibold">{j.position}</p>
                  <p className="shrink-0 text-[11px] text-[#5b564c]">
                    <span className="font-mono">{j.startDate}</span> – {j.current ? t.common.present : j.endDate}
                  </p>
                </div>
                <p className="text-[#3d3a33]">
                  {j.company} · {j.location}
                </p>
                {j.project && <p className="mt-1 font-medium text-[#7d5f33]">{j.project}</p>}
                <ul className="mt-2 flex flex-col gap-1">
                  {j.responsibilities.map((r) => (
                    <li key={r} className="flex gap-2">
                      <span className="mt-[6px] h-[3px] w-[3px] shrink-0 bg-[#9c7a46]" aria-hidden="true" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>
      </div>
    </article>
  );
}

export function CvPage({ print = false }: { print?: boolean }) {
  const t = useT();
  const lang = useLang();
  useDocumentLang();
  const pdf = lang === 'ar' ? '/cv-ar.pdf' : profile.cvUrl;

  useEffect(() => {
    if (!print) return;
    document.body.classList.add('cv-print');
    // tell the PDF script the fonts are in
    void document.fonts.ready.then(() => (document.body.dataset.cvReady = '1'));
    return () => document.body.classList.remove('cv-print');
  }, [print]);

  if (print) return <Sheet />;

  return (
    <>
      <Seo title={t.seo.cv.title} description={t.seo.cv.description} type="profile" />
      <section className="cv-page wrap pb-28 pt-[calc(var(--header-h)+72px)] sm:pt-[calc(var(--header-h)+112px)]">
        <div className="mb-12 grid gap-8 md:grid-cols-[12rem_minmax(0,1fr)]">
          <p className="label pt-3">
            <span className="text-sand">PDF</span> / {t.cv.label}
          </p>
          <div>
            <h1 className="display h-lg">{t.cv.title}</h1>
            <p className="mt-6 max-w-[52ch] text-[16px] text-bone-dim">{t.cv.lede}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={pdf} download className="btn-solid">
                <Download className="h-4 w-4" /> {t.cv.download}
              </a>
              <button type="button" className="btn-ghost" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> {t.cv.print}
              </button>
            </div>
            <div className="mt-8">
              <Pending items={profile.pending} />
            </div>
          </div>
        </div>
        <div className="-mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)] pb-4 sm:mx-0 sm:px-0">
          <div className="cv-frame w-fit border border-white/10 shadow-2xl shadow-black/50">
            <Sheet />
          </div>
        </div>
      </section>
    </>
  );
}
