import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

/** The site's section head: a narrow "index / label" column and the heading. */
export function SectionHead({
  index,
  label,
  title,
  id,
  className,
  as: Tag = 'h2',
}: {
  index: string;
  label: string;
  title: ReactNode;
  id?: string;
  className?: string;
  as?: 'h1' | 'h2';
}) {
  return (
    <div className={cn('mb-12 grid gap-5 md:mb-16 md:grid-cols-[12rem_minmax(0,1fr)]', className)}>
      <p className="label pt-3">
        <span className="text-sand">{index}</span> / {label}
      </p>
      <Tag id={id} className="display h-lg text-balance">
        {title}
      </Tag>
    </div>
  );
}

/** A list with the site's hairline rows and bronze bullets. */
export function RuleList({ items, className, dense = false }: { items: string[]; className?: string; dense?: boolean }) {
  return (
    <ul className={cn('flex flex-col', className)}>
      {items.map((r) => (
        <li
          key={r}
          className={cn(
            'flex gap-4 border-b border-white/[0.07] leading-snug text-bone-dim last:border-b-0',
            dense ? 'py-3 text-[15px]' : 'py-4 text-[16px]',
          )}
        >
          <span className="mt-[9px] h-1 w-1 shrink-0 bg-sand" aria-hidden="true" />
          {r}
        </li>
      ))}
    </ul>
  );
}

/** Development-only note listing content the owner still has to supply. Never shown in production. */
export function Pending({ items, title = 'Content needed' }: { items?: string[]; title?: string }) {
  if (!import.meta.env.DEV || !items?.length) return null;
  return (
    <aside className="border border-dashed border-amber-400/50 bg-amber-400/[0.06] p-5 text-[13px] text-amber-200/90" lang="en" dir="ltr">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em]">{title} · dev only</p>
      <ul className="list-disc pl-5">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </aside>
  );
}
