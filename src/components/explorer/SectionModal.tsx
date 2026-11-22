import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Box, Layers, X } from 'lucide-react';
import { elementLevel } from '../../lib/structure/generate';
import { sectionFacts } from '../../lib/structure/sectionMath';
import { KIND_LABEL, type StructuralElement } from '../../lib/structure/types';
import { useExplorer } from '../../store/explorerStore';
import { SectionDrawing } from './SectionDrawing';
import { hasWebGL } from '../../lib/device';

const ElementViewer = lazy(() => import('../elements/ElementViewer'));
const CAGED = new Set(['rc-column', 'rc-beam', 'rc-slab', 'ribbed-slab', 'rc-footing', 'rc-wall', 'stair', 'ramp']);

const ease = [0.22, 1, 0.36, 1] as const;

const SECTION_NAME: Record<StructuralElement['section']['kind'], string> = {
  'rc-column': 'Column section',
  'rc-beam': 'Beam section',
  'rc-slab': 'Slab section, 1 m strip',
  'ribbed-slab': 'Ribbed slab section',
  'rc-wall': 'Wall section, 1 m length',
  stair: 'Stair flight section',
  ramp: 'Ramp section, 1 m strip',
  'rc-footing': 'Footing section',
  'masonry-wall': 'Wall section',
  'timber-beam': 'Timber section',
  layered: 'Floor build-up',
  'steel-tube': 'Tube section',
};

export function SectionModal({ el, project = false }: { el?: StructuralElement; project?: boolean }) {
  const open = useExplorer((s) => s.sectionOpen);
  const openSection = useExplorer((s) => s.openSection);
  const closeRef = useRef<HTMLButtonElement>(null);
  const show = open && !!el;
  const [view, setView] = useState<'section' | '3d'>('section');
  const [webgl] = useState(() => hasWebGL());
  const can3d = !!el && webgl && CAGED.has(el.section.kind);
  const mode = can3d ? view : 'section';

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
            <div className={`relative min-h-[320px] border-b border-white/10 lg:border-b-0 lg:border-r ${mode === '3d' ? 'bg-[#0c0c0d]' : 'grid-paper p-6 pt-16 sm:p-10 sm:pt-16'}`}>
              {can3d && (
                <div className="absolute left-4 top-4 z-10 flex gap-1 rounded-sm border border-white/10 bg-ink-900/90 p-1" role="tablist" aria-label="Drawing">
                  {(['section', '3d'] as const).map((v) => (
                    <button key={v} type="button" role="tab" aria-selected={mode === v} onClick={() => setView(v)} className={`label inline-flex min-h-[36px] items-center gap-1.5 rounded-sm px-3 ${mode === v ? 'bg-bone text-ink-950' : 'text-bone-dim hover:text-bone'}`}>
                      {v === '3d' ? <Box className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />} {v === '3d' ? '3D detail' : 'Section'}
                    </button>
                  ))}
                </div>
              )}
              {mode === '3d' ? (
                <div className="h-[360px] w-full sm:h-[440px] lg:h-full">
                  <Suspense fallback={<span className="label grid h-full animate-pulse place-items-center">…</span>}>
                    <ElementViewer key={el.id} el={el} rebar />
                  </Suspense>
                </div>
              ) : (
                <motion.div
                  className="h-full min-h-[300px] w-full"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1, transition: { duration: 0.7, delay: 0.1, ease } }}
                >
                  <SectionDrawing section={el.section} />
                </motion.div>
              )}
              <p className="label pointer-events-none absolute bottom-5 left-6 right-6">
                {mode === '3d' ? 'Drag to turn · scroll to zoom' : 'Dimensions in mm · not to scale'} · {project ? 'from the issued model and drawings' : 'typical values, not a project design'}
              </p>
            </div>
            <div className="flex flex-col gap-6 p-6 sm:p-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="label mb-3 text-sand">
                    {el.label.startsWith('Roshan') ? 'Roshan build-up' : SECTION_NAME[el.section.kind]} · {elementLevel(el)}
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
              {el.note && <p className="border-l-2 border-sand/60 pl-3 text-[13px] leading-snug text-bone-mute">{el.note}</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
