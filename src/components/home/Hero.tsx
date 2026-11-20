import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Download } from 'lucide-react';
import { LineReveal } from '../ui/Motion';
import { profile } from '../../data/profile';
import { hasWebGL } from '../../lib/device';
import { useLocalePath, useProfile, useT } from '../../i18n';

const HeroStructure = lazy(() => import('../three/HeroStructure'));

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const t = useT();
  const p = useProfile();
  const lp = useLocalePath();
  const [gl] = useState(hasWebGL);
  const d = 0.05;
  const words = p.name.split(' ');
  const nameLines = [words.slice(0, 2).join(' '), words.slice(2).join(' ')].filter(Boolean);

  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="hero-title">
      {/* phones: the model is a band under the header; md+: it fills the right of the hero */}
      <div className="relative -z-10 mt-[var(--header-h)] h-[42svh] min-h-[260px] md:absolute md:inset-0 md:start-[40%] md:mt-0 md:h-auto">
        {gl ? (
          <Suspense fallback={null}>
            <HeroStructure />
          </Suspense>
        ) : (
          <img src="/renders/bayt-al-balad.jpg" alt="" className="h-full w-full object-cover opacity-80" />
        )}
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(var(--header-h)+42svh)] min-h-[calc(var(--header-h)+260px)] bg-[linear-gradient(0deg,#09090a_0%,rgba(9,9,10,0)_38%)] md:inset-0 md:h-auto md:bg-[linear-gradient(90deg,rgba(9,9,10,0.95)_0%,rgba(9,9,10,0.72)_34%,transparent_60%)] md:rtl:bg-[linear-gradient(270deg,rgba(9,9,10,0.95)_0%,rgba(9,9,10,0.72)_34%,transparent_60%)]"
        aria-hidden="true"
      />

      <div className="wrap -mt-10 flex flex-col pb-10 md:mt-0 md:min-h-[100svh] md:justify-end md:pb-10 md:pt-[calc(var(--header-h)+48px)]">
        <motion.p
          className="mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { delay: d, duration: 0.7, ease } }}
        >
          <span className="h-1.5 w-1.5 bg-sand" aria-hidden="true" />
          <span className="label text-bone">{t.home.eyebrow}</span>
        </motion.p>

        <LineReveal id="hero-title" lines={nameLines} className="display text-[clamp(40px,6.5vw,112px)]" delay={d} />

        <motion.ul
          className="mt-5 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: d + 0.2, duration: 0.6 } }}
          aria-label={p.title}
        >
          {p.titles.map((x, i) => (
            <li key={x} className="flex items-center gap-5 text-[clamp(17px,1.7vw,24px)] tracking-[-0.01em] text-bone-dim">
              {i > 0 && <span className="hidden h-3 w-px bg-white/25 sm:block" aria-hidden="true" />}
              {x}
            </li>
          ))}
        </motion.ul>

        <div className="mt-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <motion.p
            className="max-w-[52ch] text-[16px] leading-relaxed text-bone-dim sm:text-[18px]"
            initial={{ y: 12 }}
            animate={{ y: 0, transition: { delay: d + 0.2, duration: 0.7, ease } }}
          >
            {p.positioning}
          </motion.p>
          <motion.div
            className="flex flex-col gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { delay: d + 0.5, duration: 0.8, ease } }}
          >
            <Link to={lp('/projects')} className="btn-solid">
              {t.common.viewProjects} <ArrowRight className="btn-arrow h-4 w-4" />
            </Link>
            <a href={profile.cvUrl} download className="btn-ghost">
              <Download className="h-4 w-4" /> {t.common.downloadCv}
            </a>
          </motion.div>
        </div>

        <motion.dl
          className="mt-10 grid grid-cols-1 border-t border-white/10 sm:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: d + 0.65, duration: 1 } }}
        >
          {t.home.facts.map((f) => (
            <div
              key={f.k}
              className="flex flex-col-reverse gap-1.5 border-b border-white/10 py-4 sm:border-b-0 sm:border-e sm:px-5 sm:first:ps-0 sm:last:border-e-0"
            >
              <dt className="label">{f.v}</dt>
              <dd className="font-mono text-[13px] text-bone">
                <bdi dir="ltr">{f.k}</bdi>
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
