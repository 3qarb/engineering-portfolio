import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type { AnyProject } from '../../store/projectsStore';
import { useAllBuildings } from '../../store/projectsStore';
import { ProjectImage } from '../ui/ProjectImage';

/** Project rows; on desktop a drawing of the structure follows the pointer. */
export function WorkList({ projects }: { projects: AnyProject[] }) {
  const buildings = useAllBuildings();
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
          return (
            <li key={p.slug} onMouseEnter={() => setActive(i)}>
              <Link
                to={`/projects/${p.slug}`}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 border-t border-white/[0.08] py-7 transition-colors duration-500 hover:border-sand sm:gap-x-8 md:grid-cols-[3rem_minmax(0,1fr)_14rem_8rem_auto] md:py-9"
              >
                <span className="font-mono text-[12px] text-sand">{String(i + 1).padStart(2, '0')}</span>
                <span className="display text-[clamp(30px,4.6vw,68px)] transition-[transform,color] duration-500 ease-out group-hover:translate-x-3 group-hover:text-sand">
                  {p.shortTitle}
                </span>
                <span className="label hidden md:block">{p.category}</span>
                <span className="label hidden md:block">{p.period}</span>
                <ArrowUpRight className="h-6 w-6 text-bone-mute transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-sand" strokeWidth={1.4} />
                {(b || p.cover) && (
                  <span className="col-span-3 mt-3 block aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/10 bg-ink-900 md:hidden">
                    <ProjectImage project={p} spec={b} />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>

      <motion.div
        className="pointer-events-none absolute left-0 top-0 z-10 hidden md:block"
        style={{ x: sx, y: sy }}
        aria-hidden="true"
      >
        <AnimatePresence>
          {current && (spec || current.cover) && (
            <motion.div
              key={current.slug}
                            initial={{ opacity: 0, scale: 0.85, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            >
              <div className="h-[270px] w-[360px] overflow-hidden rounded-2xl border border-white/15 bg-ink-900 shadow-2xl shadow-black/60">
                <ProjectImage project={current} spec={spec} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
