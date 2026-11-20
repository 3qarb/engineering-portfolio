import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type { AnyProject } from '../../store/projectsStore';
import { useAllBuildings } from '../../store/projectsStore';
import { ProjectImage } from '../ui/ProjectImage';
import { useLocalePath, useT } from '../../i18n';

/** Project rows; on desktop a picture of the structure follows the pointer. */
export function WorkList({ projects }: { projects: AnyProject[] }) {
  const buildings = useAllBuildings();
  const t = useT();
  const lp = useLocalePath();
  const [active, setActive] = useState<number | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 30 });
  const sy = useSpring(y, { stiffness: 260, damping: 30 });
  const current = active !== null ? projects[active] : undefined;
  const spec = current ? buildings.find((b) => b.projectSlug === current.slug) : undefined;

  return (
    <div
      className="relative"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left - 180);
        y.set(e.clientY - r.top - 130);
      }}
      onMouseLeave={() => setActive(null)}
    >
      <ol className="border-b border-white/[0.08]">
        {projects.map((p, i) => {
          const b = buildings.find((s) => s.projectSlug === p.slug);
          const study = p.kind === 'study';
          return (
            <li key={p.slug} onMouseEnter={() => setActive(i)}>
              <Link
                to={lp(`/projects/${p.slug}`)}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 border-t border-white/[0.08] py-7 transition-colors duration-500 hover:border-sand sm:gap-x-8 md:grid-cols-[3rem_minmax(0,1fr)_15rem_9rem_auto] md:py-9"
              >
                <span className="font-mono text-[12px] text-sand">{String(i + 1).padStart(2, '0')}</span>
                <span className="min-w-0">
                  <span className="display block text-[clamp(28px,4.2vw,62px)] transition-[transform,color] duration-500 ease-out group-hover:translate-x-3 group-hover:text-sand rtl:group-hover:-translate-x-3">
                    {p.shortTitle}
                  </span>
                  {p.summary && <span className="mt-3 block max-w-[52ch] text-[15px] leading-snug text-bone-mute">{p.summary}</span>}
                </span>
                <span className="label hidden md:block">{p.category}</span>
                <span className={study ? 'label hidden text-bone-faint md:block' : 'label hidden md:block'}>
                  {study ? t.common.illustrative : p.period}
                </span>
                <ArrowUpRight
                  className="icon-dir h-6 w-6 text-bone-mute transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-sand"
                  strokeWidth={1.4}
                />
                <span className="col-span-3 flex flex-wrap gap-x-4 gap-y-1 md:hidden">
                  <span className="label">{p.category}</span>
                  <span className="label text-bone-faint">{study ? t.common.illustrative : p.period}</span>
                </span>
                {(b || p.cover) && (
                  <span className="col-span-3 mt-3 block aspect-[16/9] w-full overflow-hidden border border-white/10 bg-ink-900 md:hidden">
                    <ProjectImage project={p} spec={b} />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>

      <motion.div className="pointer-events-none absolute left-0 top-0 z-10 hidden md:block" style={{ x: sx, y: sy }} aria-hidden="true">
        <AnimatePresence>
          {current && (spec || current.cover) && (
            <motion.div
              key={current.slug}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
            >
              <div className="h-[270px] w-[360px] overflow-hidden border border-white/15 bg-ink-900 shadow-2xl shadow-black/60">
                <ProjectImage project={current} spec={spec} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
