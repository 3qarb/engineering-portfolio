import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import { Explorer } from '../components/explorer/Explorer';
import { FadeUp, LineReveal } from '../components/ui/Motion';
import { useAllBuildings, useAllProjects, useProjectsStore } from '../store/projectsStore';
import { NotFound } from './NotFound';

function Block({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-white/[0.08] py-14 md:grid-cols-[14rem_minmax(0,1fr)] md:py-20">
      <p className="label pt-1">
        <span className="text-sand">{index}</span> / {title}
      </p>
      <div className="max-w-[68ch]">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((r) => (
        <li key={r} className="flex gap-4 border-b border-white/[0.07] py-4 text-[16px] leading-snug text-bone-dim last:border-b-0">
          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-sand" />
          {r}
        </li>
      ))}
    </ul>
  );
}

export function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const projects = useAllProjects();
  const buildings = useAllBuildings();
  const remove = useProjectsStore((s) => s.remove);
  const ownSaved = useProjectsStore((s) => s.userProjects.some((p) => p.slug === slug));

  const i = projects.findIndex((p) => p.slug === slug);
  const p = projects[i];
  if (!p) return <NotFound />;
  const next = projects[(i + 1) % projects.length];
  const spec = buildings.find((b) => b.projectSlug === p.slug);

  const present = [
    !!p.overview,
    p.responsibilities.length > 0,
    !!p.engineeringContext,
    p.challenges.length > 0,
    !!(p.structuralAssessment || p.methodology),
    p.solutions.length > 0,
    p.software.length > 0 || p.drawings.length > 0,
  ];
  /** Running number of block k among the blocks that are shown */
  const idx = (k: number) => String(present.slice(0, k + 1).filter(Boolean).length).padStart(2, '0');

  return (
    <>
      <section className="wrap pb-14 pt-[calc(var(--header-h)+56px)] sm:pt-[calc(var(--header-h)+88px)]">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Link to="/projects" className="label inline-flex min-h-[44px] items-center gap-2 hover:text-bone">
            <ArrowLeft className="h-3.5 w-3.5" /> All projects
          </Link>
          {ownSaved && (
            <div className="flex gap-3">
              <Link to={`/projects/${p.slug}/edit`} className="btn-ghost min-h-[42px]">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
              <button
                type="button"
                className="btn-ghost min-h-[42px] hover:!border-rust hover:!bg-rust hover:!text-bone"
                onClick={() => {
                  if (window.confirm(`Delete “${p.title}” from this browser? This cannot be undone.`)) {
                    remove(p.slug);
                    navigate('/projects');
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
        <p className="label mb-6 text-sand">{p.category}</p>
        <LineReveal lines={[p.title]} className="display h-lg max-w-[18ch]" />
        <FadeUp delay={0.3}>
          <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
            {[
              ['Role', p.role],
              ['Client', p.client],
              ['Location', p.location],
              ['Period', p.period],
              ['Status', p.status.replace('-', ' ')],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="bg-ink-950 p-5">
                  <dt className="label mb-2">{k}</dt>
                  <dd className="text-[15px] capitalize text-bone">{v}</dd>
                </div>
              ))}
          </dl>
        </FadeUp>
      </section>

      {p.cover && (
        <div className="wrap pb-14">
          <img src={p.cover} alt={p.title} className="aspect-[16/9] w-full rounded-3xl object-cover" />
        </div>
      )}

      {spec && (
        <section className="wrap pb-20" aria-label="3D structure">
          <Explorer
            lockBuildingId={spec.id}
            className="rounded-3xl border border-white/10 lg:h-[82vh] lg:min-h-[640px]"
          />
        </section>
      )}

      <div className="wrap pb-10">
        {p.overview && (
          <Block index={idx(0)} title="Overview">
            <p className="lede">{p.overview}</p>
          </Block>
        )}
        {p.responsibilities.length > 0 && (
          <Block index={idx(1)} title="My responsibility">
            {p.role && <p className="mb-6 text-[30px] font-medium leading-tight tracking-[-0.03em] text-sand">{p.role}</p>}
            <List items={p.responsibilities} />
          </Block>
        )}
        {p.engineeringContext && (
          <Block index={idx(2)} title="Context">
            <p className="text-[17px] leading-relaxed text-bone-dim">{p.engineeringContext}</p>
          </Block>
        )}
        {p.challenges.length > 0 && (
          <Block index={idx(3)} title="Challenges">
            <List items={p.challenges} />
          </Block>
        )}
        {(p.structuralAssessment || p.methodology) && (
          <Block index={idx(4)} title="Method">
            {p.structuralAssessment && <p className="mb-6 text-[17px] leading-relaxed text-bone-dim">{p.structuralAssessment}</p>}
            {p.methodology && <p className="text-[17px] leading-relaxed text-bone-dim">{p.methodology}</p>}
          </Block>
        )}
        {p.solutions.length > 0 && (
          <Block index={idx(5)} title="Outcomes">
            <List items={p.solutions} />
          </Block>
        )}
        {(p.software.length > 0 || p.drawings.length > 0) && (
          <Block index={idx(6)} title="Tools & drawings">
            <div className="mb-8 flex flex-wrap gap-2">
              {p.software.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
            {p.drawings.length > 0 && <List items={p.drawings} />}
          </Block>
        )}
      </div>

      {next && next.slug !== p.slug && (
        <Link to={`/projects/${next.slug}`} className="group block border-t border-white/[0.08]">
          <div className="wrap flex items-end justify-between gap-6 py-20 sm:py-28">
            <div>
              <p className="label mb-6">Next project</p>
              <p className="display h-lg transition-colors duration-500 group-hover:text-sand">{next.shortTitle}</p>
            </div>
            <ArrowUpRight className="h-14 w-14 shrink-0 text-sand transition-transform duration-500 group-hover:-translate-y-2 group-hover:translate-x-2" strokeWidth={1} />
          </div>
        </Link>
      )}
    </>
  );
}
