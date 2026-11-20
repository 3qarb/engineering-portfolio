import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { levelName } from '../../lib/structure/generate';
import { sectionFacts } from '../../lib/structure/sectionMath';
import { KIND_LABEL, type StructuralElement } from '../../lib/structure/types';
import { useExplorer } from '../../store/explorerStore';
import { SectionDrawing } from './SectionDrawing';

const ease = [0.22, 1, 0.36, 1] as const;

const SECTION_NAME: Record<StructuralElement['section']['kind'], string> = {
  'rc-column': 'Column section',
  'rc-beam': 'Beam section',
  'rc-slab': 'Slab section, 1 m strip',
  'rc-footing': 'Footing section',
  'masonry-wall': 'Wall section',
  'timber-beam': 'Timber section',
  layered: 'Floor build-up',
  'steel-tube': 'Tube section',
};

export function SectionModal({ el }: { el?: StructuralElement }) {
  const open = useExplorer((s) => s.sectionOpen);
  const openSection = useExplorer((s) => s.openSection);
  const closeRef = useRef<HTMLButtonElement>(null);
  const show = open && !!el;

  useEffect(() => {
    if (!show) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && openSection(false);
    window.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
      prev?.focus();
    };
  }, [show, openSection]);

  return (
    <AnimatePresence>
      {show && el && (
        <motion.div
          className="fixed inset-0 z-[150] flex items-end justify-center bg-ink-950/80 p-0 backdrop-blur-md sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => openSection(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="section-title"
            className="relative grid max-h-[92vh] w-full max-w-6xl overflow-auto rounded-t-3xl border border-white/10 bg-ink-900 sm:rounded-sm lg:grid-cols-[1.4fr_1fr]"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1, transition: { duration: 0.55, ease } }}
            exit={{ y: 20, opacity: 0, transition: { duration: 0.2 } }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid-paper relative min-h-[320px] border-b border-white/10 p-6 sm:p-10 lg:border-b-0 lg:border-r">
              <motion.div
                className="h-full min-h-[300px] w-full"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.7, delay: 0.1, ease } }}
              >
                <SectionDrawing section={el.section} />
              </motion.div>
              <p className="label absolute bottom-5 left-6">Dimensions in mm · not to scale · typical values, not a project design</p>
            </div>
            <div className="flex flex-col gap-6 p-6 sm:p-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="label mb-3 text-sand">
                    {el.label.startsWith('Roshan') ? 'Roshan build-up' : SECTION_NAME[el.section.kind]} · {levelName(el.level)}
                  </p>
                  <h3 id="section-title" className="display h-md">
                    {el.label}
                  </h3>
                  <p className="mt-2 font-mono text-[12px] text-bone-mute">
                    {KIND_LABEL[el.kind]} · grid {el.grid} · {el.id}
                  </p>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => openSection(false)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 text-bone transition-colors hover:border-bone hover:bg-bone hover:text-ink-950"
                  aria-label="Close the section"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <dl>
                {sectionFacts(el.section).map((f, i) => (
                  <motion.div
                    key={f.label}
                    className="flex items-baseline justify-between gap-4 border-b border-white/[0.07] py-3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.15 + i * 0.04, duration: 0.4, ease } }}
                  >
                    <dt className="label">{f.label}</dt>
                    <dd className="text-right font-mono text-[14px] text-bone">{f.value}</dd>
                  </motion.div>
                ))}
              </dl>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
