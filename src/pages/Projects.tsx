import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Download, Plus, Search, Upload, X } from 'lucide-react';
import { LineReveal } from '../components/ui/Motion';
import { ProjectImage } from '../components/ui/ProjectImage';
import { Seo } from '../components/Seo';
import { exportProjects, useAllBuildings, useAllProjects, useProjectsStore, type AnyProject, type UserProject } from '../store/projectsStore';
import { useLocalePath, useLocalized, useT } from '../i18n';

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ًͯ-ٟ]/g, '');

function matches(p: AnyProject, q: string) {
  if (!q) return true;
  const hay = norm([p.title, p.shortTitle, p.category, p.location, p.summary ?? '', p.role ?? '', ...p.software].join(' '));
  return norm(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

function Card({ p, i, wide = false }: { p: AnyProject; i: number; wide?: boolean }) {
  const t = useT();
  const lp = useLocalePath();
  const buildings = useAllBuildings();
  const spec = buildings.find((b) => b.projectSlug === p.slug);
  const study = p.kind === 'study';
  return (
    <motion.li
      className={wide ? 'md:col-span-2' : undefined}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.04 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
    >
      <Link to={lp(`/projects/${p.slug}`)} className="group block">
        <div
          className={`relative overflow-hidden border border-white/10 bg-ink-900 transition-[border-color,transform] duration-500 group-hover:-translate-y-0.5 group-hover:border-sand/60 ${
            wide ? 'aspect-[4/3] md:aspect-[16/9]' : 'aspect-[4/3]'
          }`}
        >
          {p.cover || p.render || spec ? (
            <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
              <ProjectImage project={p} spec={spec} />
            </div>
          ) : (
            <span className="display absolute inset-0 grid place-items-center text-[120px] text-white/10">{p.shortTitle.slice(0, 2)}</span>
          )}
          <span className="label absolute start-5 top-5 text-sand">{String(i + 1).padStart(2, '0')}</span>
          {p.userCreated && (
            <span className="absolute end-5 top-5 bg-sand px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-950">{t.projects.saved}</span>
          )}
          {study && !p.userCreated && (
            <span className="label absolute end-5 top-5 border border-white/20 bg-ink-950/80 px-2.5 py-1.5 text-bone-dim">{t.common.illustrative}</span>
          )}
        </div>
        <div className="mt-5">
          <p className="label flex flex-wrap gap-x-4 gap-y-1">
            <span>{p.category}</span>
            {p.period && <span className="text-bone-faint">{p.period}</span>}
          </p>
          <h3 className="display mt-3 text-[clamp(26px,2.8vw,40px)] transition-colors duration-300 group-hover:text-sand">{p.shortTitle}</h3>
          {p.summary && <p className="mt-2 max-w-[52ch] text-[14px] leading-snug text-bone-mute">{p.summary}</p>}
        </div>
      </Link>
    </motion.li>
  );
}

export function Projects() {
  const t = useT();
  const projects = useLocalized(useAllProjects());
  const userProjects = useProjectsStore((s) => s.userProjects);
  const importMany = useProjectsStore((s) => s.importMany);
  const [params, setParams] = useSearchParams();
  const filter = params.get('type') ?? '';
  const [query, setQuery] = useState(params.get('q') ?? '');
  const q = useDeferredValue(query);
  const [note, setNote] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => [...new Set(projects.map((p) => p.category))], [projects]);
  const shown = projects.filter((p) => (!filter || p.category === filter) && matches(p, q));
  const real = shown.filter((p) => p.kind !== 'study');
  const studies = shown.filter((p) => p.kind === 'study');

  const setFilter = (c: string) => {
    const next = new URLSearchParams(params);
    if (c) next.set('type', c);
    else next.delete('type');
    setParams(next, { replace: true });
  };

  const onImport = async (file?: File) => {
    if (!file) return;
    try {
      const json: unknown = JSON.parse(await file.text());
      setNote(t.projects.imported(importMany((Array.isArray(json) ? json : [json]) as UserProject[])));
    } catch {
      setNote(t.projects.badFile);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <Seo title={t.seo.projects.title} description={t.seo.projects.description} />
      <section className="wrap pb-14 pt-[calc(var(--header-h)+72px)] sm:pt-[calc(var(--header-h)+112px)]">
        <p className="label mb-8">
          <span className="text-sand">{String(projects.length).padStart(2, '0')}</span> / {t.projects.label}
        </p>
        <LineReveal lines={[t.projects.lineA, <span key="2" className="text-bone-mute">{t.projects.lineB}</span>]} className="display h-xl" />

        <div className="mt-12 grid gap-6 border-t border-white/[0.08] pt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-md">
              <span className="sr-only">{t.projects.search}</span>
              <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bone-mute" aria-hidden="true" />
              <input
                type="search"
                className="field ps-11"
                placeholder={t.projects.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <Link to="/projects/new" className="btn-solid">
                <Plus className="h-4 w-4" /> {t.projects.add}
              </Link>
              <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> {t.projects.import}
              </button>
              {userProjects.length > 0 && (
                <button type="button" className="btn-ghost" onClick={() => exportProjects(userProjects)}>
                  <Download className="h-4 w-4" /> {t.projects.export} ({userProjects.length})
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                tabIndex={-1}
                aria-label={t.projects.import}
                onChange={(e) => void onImport(e.target.files?.[0])}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.projects.filter}>
            <button type="button" className="chip" aria-pressed={!filter} onClick={() => setFilter('')}>
              {t.projects.all}
            </button>
            {categories.map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={filter === c} onClick={() => setFilter(filter === c ? '' : c)}>
                {c}
              </button>
            ))}
            <span className="label ms-auto" role="status" aria-live="polite">
              {t.projects.shown(shown.length, projects.length)}
            </span>
          </div>
        </div>
        {note && (
          <p role="status" className="mt-4 font-mono text-[12px] text-sand">
            {note}
          </p>
        )}
      </section>

      <section className="wrap pb-28 sm:pb-36" aria-label={t.projects.label}>
        {shown.length === 0 && (
          <div className="flex flex-col items-start gap-6 border-t border-white/[0.08] py-16">
            <p className="text-[17px] text-bone-dim">{t.projects.none}</p>
            <button type="button" className="btn-ghost" onClick={() => (setQuery(''), setFilter(''))}>
              <X className="h-4 w-4" /> {t.projects.clear}
            </button>
          </div>
        )}

        {real.length > 0 && (
          <>
            <h2 className="label mb-8 border-t border-white/[0.08] pt-6">
              <span className="text-sand">A</span> / {t.projects.groupProjects}
            </h2>
            <ul className="grid gap-x-6 gap-y-14 md:grid-cols-2">
              {real.map((p, i) => (
                <Card key={p.slug} p={p} i={i} wide={i === 0 && real.length % 2 === 1} />
              ))}
            </ul>
          </>
        )}

        {studies.length > 0 && (
          <div className={real.length ? 'mt-24' : ''}>
            <div className="mb-8 grid gap-3 border-t border-white/[0.08] pt-6 md:grid-cols-[12rem_minmax(0,1fr)]">
              <h2 className="label">
                <span className="text-sand">B</span> / {t.projects.groupStudies}
              </h2>
              <p className="max-w-[64ch] text-[14px] leading-snug text-bone-mute">{t.projects.studiesNote}</p>
            </div>
            <ul className="grid gap-x-6 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
              {studies.map((p, i) => (
                <Card key={p.slug} p={p} i={i} />
              ))}
            </ul>
          </div>
        )}

        <aside className="mt-24 grid gap-6 border border-white/[0.08] p-8 sm:p-10 md:grid-cols-[12rem_minmax(0,1fr)]">
          <p className="label text-sand">{t.projects.howTitle}</p>
          <p className="max-w-[64ch] text-[15px] leading-relaxed text-bone-dim">{t.projects.how}</p>
        </aside>
      </section>
    </>
  );
}
