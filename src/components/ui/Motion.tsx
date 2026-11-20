import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { cn } from '../../utils/cn';

const ease = [0.22, 1, 0.36, 1] as const;

/** Lines that rise out of a mask, once, on mount. */
export function LineReveal({
  lines,
  className,
  delay = 0,
  as: Tag = 'h1',
}: {
  lines: ReactNode[];
  className?: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'p';
}) {
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em]">
          <motion.span
            className="block"
            initial={{ y: '105%' }}
            animate={{ y: '0%', transition: { duration: 1, delay: delay + i * 0.09, ease } }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** A small fade-up used once per page block. */
export function FadeUp({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay, ease } }}
    >
      {children}
    </motion.div>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className="inline">
      {children}{' '}
    </motion.span>
  );
}

/** Words light up one by one as the paragraph passes through the viewport. */
export function ScrollFillText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const words = text.split(' ');
  return (
    <p ref={ref} className={cn('text-pretty', className)}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {w}
        </Word>
      ))}
    </p>
  );
}

export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((t) => (
        <span key={t} className="flex items-center">
          <span className="px-6">{t}</span>
          <span className="h-1.5 w-1.5 rotate-45 bg-sand" aria-hidden="true" />
        </span>
      ))}
    </div>
  );
  return (
    <div className={cn('marquee overflow-hidden', className)} aria-label={items.join(', ')}>
      <div className="marquee-track flex w-max" aria-hidden="true">
        {row}
        {row}
        {row}
        {row}
      </div>
    </div>
  );
}
