import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Box } from 'lucide-react';
import { LineReveal } from '../ui/Motion';
import { useUi } from '../../store/uiStore';

const HeroStructure = lazy(() => import('../three/HeroStructure'));

const ease = [0.22, 1, 0.36, 1] as const;

const FACTS = [
  { k: '300+', v: 'historic buildings in Al-Balad' },
  { k: '2022', v: 'technical office, IKK Group' },
  { k: 'ETABS · SAP2000', v: 'AutoCAD · Revit' },
];

export function Hero() {
  const introDone = useUi((s) => s.introDone);
  const d = introDone ? 0.1 : 9; // hold the entrance until the preloader lifts

  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="hero-title">
      <div className="absolute inset-0 -z-10 md:left-[28%]">
        <Suspense fallback={null}>
          <HeroStructure />
        </Suspense>
      </div>
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/85 to-ink-950/25 md:bg-[linear-gradient(90deg,rgba(9,9,10,0.94)_0%,rgba(9,9,10,0.7)_32%,transparent_58%)]"
        aria-hidden="true"
      />

      <div className="wrap flex min-h-[100svh] flex-col justify-end pb-8 pt-[calc(var(--header-h)+56px)] sm:pb-10">
        {introDone && (
          <>
            <motion.div
              className="mb-6 flex items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { delay: d, duration: 0.7, ease } }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-sand" />
              <span className="label text-bone">Abdulaziz Kanaan · Jeddah, Saudi Arabia</span>
            </motion.div>

            <LineReveal
              lines={[
                'Structural',
                'engineer',
              ]}
              className="display h-xl"
              delay={d}
            />
            <motion.p
              className="mt-3 text-[clamp(20px,2.3vw,34px)] font-normal tracking-[-0.02em] text-bone-mute"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: d + 0.25, duration: 0.8 } }}
            >
              for buildings that have to last
            </motion.p>

            <div className="mt-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
              <motion.p
                className="max-w-[46ch] text-[17px] leading-relaxed text-bone-dim sm:text-[19px]"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { delay: d + 0.35, duration: 0.8, ease } }}
              >
                Technical office engineer on the restoration of 300+ historic buildings in Jeddah's Al-Balad, a UNESCO
                World Heritage site. I size the members, draw the details and design the works that hold a building up
                while it is saved.
              </motion.p>
              <motion.div
                className="flex flex-col gap-3 sm:flex-row"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { delay: d + 0.45, duration: 0.8, ease } }}
              >
                <Link to="/explorer" className="btn-solid">
                  <Box className="h-4 w-4" /> Explore the structures
                </Link>
                <Link to="/projects" className="btn-ghost">
                  See the work <ArrowRight className="btn-arrow h-4 w-4" />
                </Link>
              </motion.div>
            </div>

            <motion.dl
              className="mt-10 grid grid-cols-1 border-t border-white/10 sm:grid-cols-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: d + 0.6, duration: 1 } }}
            >
              {FACTS.map((f) => (
                <div key={f.k} className="flex flex-col gap-1.5 border-b border-white/10 py-4 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0">
                  <dt className="font-mono text-[13px] text-bone">{f.k}</dt>
                  <dd className="label">{f.v}</dd>
                </div>
              ))}
            </motion.dl>
          </>
        )}
      </div>
    </section>
  );
}
