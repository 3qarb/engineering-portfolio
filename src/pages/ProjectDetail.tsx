import { lazy, Suspense } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Info, Pencil, Trash2 } from 'lucide-react';
import { FadeUp, LineReveal } from '../components/ui/Motion';
import { Pending, RuleList } from '../components/ui/Section';
import { Seo } from '../components/Seo';
import { useAllBuildings, useAllProjects, useProjectsStore } from '../store/projectsStore';
import { useLocalePath, useLocalized, useT } from '../i18n';
import { NotFound } from './NotFound';

const Explorer = lazy(() => import('../components/explorer/Explorer').then((m) => ({ default: m.Explorer })));

function Block({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-white/[0.08] py-14 md:grid-cols-[14rem_minmax(0,1fr)] md:py-20">
      <h2 className="label pt-1">
        <span className="text-sand">{index}</span> / {title}
      </h2>
      <div className="max-w-[70ch]">{children}</div>
    </section>
  );
}

export function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const lp = useLocalePath();
  const projects = useLocalized(useAllProjects());
  const buildings = useAllBuildings();
  const remove = useProjectsStore((s) => s.remove);
  const ownSaved = useProjectsStore((s) => s.userProjects.some((p) => p.slug === slug));

  const i = projects.findIndex((p) => p.slug === slug);
  const p = projects[i];
  if (!p) return <NotFound />;
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];
  const spec = buildings.find((b) => b.projectSlug === p.slug);
  const study = p.kind === 'study';
  const b = t.detail.blocks;

  // Each block is shown only when it has content; numbering follows what is shown.
  const blocks: { key: string; title: string; body: React.ReactNode }[] = [];
  const add = (key: string, title: string, when: unknown, body: React.ReactNode) => {
    if (when && (!Array.isArray(when) || when.length)) blocks.push({ key, title, body });
  };
  add('overview', b.overview, p.overview, <p className="lede">{p.overview}</p>);
  add(
    'role',
    b.role,
    p.role || p.responsibilities.length,
    <>
      {p.role && <p className="mb-6 text-[clamp(22px,2.4vw,30px)] font-medium leading-tight tracking-[-0.02em] text-sand">{p.role}</p>}
      <RuleList items={p.responsibilities} />
    </>,
  );
  add('scope', b.scope, p.scope, <RuleList items={p.scope ?? []} />);
  add('existing', b.existing, p.existingConditions, <p className="text-[17px] leading-relaxed text-bone-dim">{p.existingConditions}</p>);
  add('context', b.context, p.engineeringContext, <p className="text-[17px] leading-relaxed text-bone-dim">{p.engineeringContext}</p>);
  add('challenges', b.challenges, p.challenges, <RuleList items={p.challenges} />);
  add(
    'method',
    b.method,
    p.structuralAssessment || p.methodology,
    <div className="flex flex-col gap-6 text-[17px] leading-relaxed text-bone-dim">
      {p.structuralAssessment && <p>{p.structuralAssessment}</p>}
      {p.methodology && <p>{p.methodology}</p>}
    </div>,
  );
  add('solutions', b.solutions, p.solutions, <RuleList items={p.solutions} />);
  add(
    'technical',
    b.technical,
    p.technical,
    <dl className="grid border-t border-white/[0.07] sm:grid-cols-2">
      {(p.technical ?? []).map((r) => (
        <div key={r.label} className="border-b border-white/[0.07] py-4 sm:odd:pe-6">
          <dt className="label mb-2">{r.label}</dt>
          <dd className="text-[16px] text-bone">{r.value}</dd>
        </div>
      ))}
    </dl>,
  );
  add('drawings', b.drawings, p.drawings, <RuleList items={p.drawings} />);
  add(
    'software',
    b.software,
    p.software,
    <div className="flex flex-wrap gap-2" lang="en">
      {p.software.map((s) => (
        <span key={s} className="chip pointer-events-none">
          {s}
        </span>
      ))}
    </div>,
  );
  add(
    'gallery',
    b.gallery,
    p.gallery,
    <div className="grid gap-6 sm:grid-cols-2">
      {(p.gallery ?? []).map((f, k) => (
        <figure key={f.src}>
          <img src={f.src} alt={f.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full border border-white/10 object-cover" />
          <figcaption className="label mt-3">
            Fig. {String(k + 1).padStart(2, '0')}
            {f.caption ? ` · ${f.caption}` : ''}
          </figcaption>
        </figure>
      ))}
    </div>,
  );

  const meta = [
    [t.detail.meta.type, p.category],
    [t.detail.meta.location, p.location],
    [t.detail.meta.period, p.period],
    [t.detail.meta.client, p.client],
    [t.detail.meta.status, t.detail.status[p.status]],
  ].filter(([, v]) => v);

  return (
    <>
      <Seo title={`${p.title} — Abdulaziz Kanaan`} description={p.summary || p.overview.slice(0, 155)} type="article" image={p.cover?.startsWith('/') ? p.cover : undefined} />
      <section className="wrap pb-14 pt-[calc(var(--header-h)+56px)] sm:pt-[calc(var(--header-h)+88px)]">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Link to={lp('/projects')} className="label inline-flex min-h-[44px] items-center gap-2 hover:text-bone">
            <ArrowLeft className="icon-dir h-3.5 w-3.5" /> {t.detail.back}
          </Link>
          {ownSaved && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="label text-sand">{t.detail.localOnly}</span>
              <Link to={`/projects/${p.slug}/edit`} className="btn-ghost min-h-[44px]">
                <Pencil className="h-3.5 w-3.5" /> {t.detail.edit}
              </Link>
              <button
                type="button"
                className="btn-ghost min-h-[44px] hover:!border-rust hover:!bg-rust hover:!text-bone"
                onClick={() => {
                  if (window.confirm(t.detail.confirmDelete(p.title))) {
                    remove(p.slug);
                    navigate(lp('/projects'));
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> {t.detail.delete}
              </button>
            </div>
          )}
        </div>
        <p className="label mb-6 text-sand">{study ? t.common.illustrative : p.category}</p>
        <LineReveal lines={[p.title]} className="display h-lg max-w-[20ch] text-balance" />
        {p.summary && (
          <FadeUp delay={0.2}>
            <p className="mt-8 max-w-[56ch] text-[18px] leading-relaxed text-bone-dim">{p.summary}</p>
          </FadeUp>
        )}
        <FadeUp delay={0.3}>
          <dl className="mt-12 grid grid-cols-2 gap-px border border-white/[0.08] bg-white/[0.08] md:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
            {meta.map(([k, v]) => (
              <div key={k} className="bg-ink-950 p-5">
                <dt className="label mb-2">{k}</dt>
                <dd className="text-[15px] text-bone">{v}</dd>
              </div>
            ))}
          </dl>
          {study && (
            <p className="mt-6 flex max-w-[70ch] items-start gap-3 text-[14px] leading-snug text-bone-mute">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sand" /> {t.common.illustrativeNote}
            </p>
          )}
        </FadeUp>
      </section>

      {p.cover && (
        <div className="wrap pb-14">
          <img src={p.cover} alt={p.title} className="aspect-[16/9] w-full border border-white/10 object-cover" />
        </div>
      )}

      {spec && (
        <section className="wrap pb-20" aria-label={t.detail.model}>
          <Suspense fallback={<div className="h-[68svh] min-h-[420px] border border-white/10 bg-ink-950" />}>
            <Explorer lockBuildingId={spec.id} className="border border-white/10 lg:h-[82vh] lg:min-h-[640px]" />
          </Suspense>
        </section>
      )}

      <div className="wrap pb-10">
        {blocks.map((blk, k) => (
          <Block key={blk.key} index={String(k + 1).padStart(2, '0')} title={blk.title}>
            {blk.body}
          </Block>
        ))}
        <Pending items={p.pending} />
      </div>

      {projects.length > 1 && (
        <nav className="grid border-t border-white/[0.08] sm:grid-cols-2" aria-label={t.projects.label}>
          <Link to={lp(`/projects/${prev.slug}`)} className="group block border-b border-white/[0.08] sm:border-b-0 sm:border-e">
            <div className="wrap flex flex-col gap-4 py-14 sm:py-20">
              <p className="label">{t.detail.prev}</p>
              <p className="display text-[clamp(26px,3.4vw,52px)] transition-colors duration-500 group-hover:text-sand">{prev.shortTitle}</p>
            </div>
          </Link>
          <Link to={lp(`/projects/${next.slug}`)} className="group block">
            <div className="wrap flex items-end justify-between gap-6 py-14 sm:py-20">
              <div className="flex flex-col gap-4">
                <p className="label">{t.detail.next}</p>
                <p className="display text-[clamp(26px,3.4vw,52px)] transition-colors duration-500 group-hover:text-sand">{next.shortTitle}</p>
              </div>
              <ArrowUpRight className="icon-dir h-10 w-10 shrink-0 text-sand transition-transform duration-500 group-hover:-translate-y-2 group-hover:translate-x-2" strokeWidth={1} />
            </div>
          </Link>
        </nav>
      )}
    </>
  );
}
