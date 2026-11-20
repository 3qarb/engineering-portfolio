import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Download, Plus, Upload } from 'lucide-react';
import { LineReveal } from '../components/ui/Motion';
import { ProjectImage } from '../components/ui/ProjectImage';
import { exportProjects, useAllBuildings, useAllProjects, useProjectsStore, type UserProject } from '../store/projectsStore';

export function Projects() {
  const projects = useAllProjects();
  const buildings = useAllBuildings();
  const userProjects = useProjectsStore((s) => s.userProjects);
  const importMany = useProjectsStore((s) => s.importMany);
  const [filter, setFilter] = useState<string>('All');
  const [note, setNote] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => ['All', ...new Set(projects.map((p) => p.category))], [projects]);
  const shown = filter === 'All' ? projects : projects.filter((p) => p.category === filter);

  const onImport = async (file?: File) => {
    if (!file) return;
    try {
      const json: unknown = JSON.parse(await file.text());
      const n = importMany((Array.isArray(json) ? json : [json]) as UserProject[]);
      setNote(n ? `Imported ${n} project${n > 1 ? 's' : ''}.` : 'No projects found in that file.');
    } catch {
      setNote('That file is not a projects export.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <section className="wrap pb-16 pt-[calc(var(--header-h)+72px)] sm:pt-[calc(var(--header-h)+112px)]">
        <p className="label mb-8">
          <span className="text-sand">{String(projects.length).padStart(2, '0')}</span> / Projects
        </p>
        <LineReveal
          lines={['Work that', <span key="2">holds <span className="serif-accent">up</span></span>]}
          className="display h-xl"
        />
        <div className="mt-12 flex flex-col gap-6 border-t border-white/[0.08] pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {categories.map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/projects/new" className="btn-solid">
              <Plus className="h-4 w-4" /> Add a project
            </Link>
            <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Import
            </button>
            {userProjects.length > 0 && (
              <button type="button" className="btn-ghost" onClick={() => exportProjects(userProjects)}>
                <Download className="h-4 w-4" /> Export ({userProjects.length})
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Import a projects file"
              onChange={(e) => void onImport(e.target.files?.[0])}
            />
          </div>
        </div>
        {note && (
          <p role="status" className="mt-4 font-mono text-[12px] text-sand">
            {note}
          </p>
        )}
      </section>

      <section className="wrap pb-28 sm:pb-40" aria-label="Project list">
        <ul className="grid gap-x-6 gap-y-14 md:grid-cols-2">
          {shown.map((p, i) => {
            const spec = buildings.find((b) => b.projectSlug === p.slug);
            return (
              <motion.li
                key={p.slug}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.05 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
              >
                <Link to={`/projects/${p.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-ink-900 text-bone/55 transition-[border-color,transform] duration-500 group-hover:-translate-y-0.5 group-hover:border-sand/60 group-hover:text-bone">
                    {p.cover || p.render || spec ? (
                      <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                        <ProjectImage project={p} spec={spec} />
                      </div>
                    ) : (
                      <span className="display absolute inset-0 grid place-items-center text-[120px] text-white/10">
                        {p.shortTitle.slice(0, 2)}
                      </span>
                    )}
                    <span className="label absolute left-5 top-5 text-sand">{String(i + 1).padStart(2, '0')}</span>
                    {p.userCreated && (
                      <span className="absolute right-5 top-5 rounded-full bg-sand px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-950">
                        Added
                      </span>
                    )}
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-6">
                    <div>
                      <h2 className="display text-[clamp(28px,3vw,44px)] transition-colors duration-300 group-hover:text-sand">
                        {p.shortTitle}
                      </h2>
                      <p className="mt-2 text-[14px] text-bone-mute">{p.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="label">{p.category}</p>
                      <p className="label mt-2">{p.period}</p>
                    </div>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>

        <aside className="mt-24 grid gap-6 rounded-3xl border border-white/[0.08] p-8 sm:p-10 md:grid-cols-[12rem_minmax(0,1fr)]">
          <p className="label text-sand">How adding works</p>
          <div className="max-w-[60ch] text-[15px] leading-relaxed text-bone-dim">
            <p>
              Projects you add are saved in this browser straight away, with their own 3D structure in the explorer. To
              publish them for every visitor, press Export and put the downloaded <code className="font-mono text-bone">projects.json</code>{' '}
              in the site's <code className="font-mono text-bone">public/data/</code> folder before you deploy.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
