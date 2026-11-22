import { useMemo, useRef, useState, type ReactNode } from 'react';
import { AgentCards, type AgentState } from '../components/importer/AgentCards';
import { BuilderReport } from '../components/importer/BuilderReport';
import { CheckerReport } from '../components/importer/CheckerReport';
import { FilePicker } from '../components/importer/FilePicker';
import { ReaderReport } from '../components/importer/ReaderReport';
import { SavedProject } from '../components/importer/SaveProject';
import { nameFromFile, toProject } from '../lib/import/project';
import { FadeUp, LineReveal } from '../components/ui/Motion';
import { Seo } from '../components/Seo';
import { readInput, runPipeline, specFromModel, type AgentId, type InputFile, type PipelineResult } from '../lib/import/pipeline';
import { slugify, useAllProjects, useProjectsStore, type UserProject } from '../store/projectsStore';
import { useLocalePath } from '../i18n';
import { useTools } from '../i18n/tools';

const MAX_BYTES = 60e6;
const IDLE: Record<AgentId, AgentState> = { reader: 'waiting', checker: 'waiting', builder: 'waiting' };
/** Model titles that say nothing about the project */
const GENERIC_TITLE = /^(untitled|model|new model|etabs|safe|project)?\s*\d*$/i;

function Report({ id, n, title, children }: { id: string; n: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-[calc(var(--header-h)+24px)] border-t border-white/[0.08] py-14">
      <div className="grid gap-8 md:grid-cols-[12rem_minmax(0,1fr)]">
        <p className="label">
          <span className="text-sand">{n}</span> / {title}
        </p>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

/**
 * Add a project by dropping its ETABS (and SAFE) files: Reader → Checker → Builder run at once in
 * the browser, and the project is added to the portfolio with no form to fill.
 */
export function ImportProject() {
  const tools = useTools();
  const t = tools.importer;
  const lp = useLocalePath();
  const save = useProjectsStore((s) => s.save);
  const all = useAllProjects();
  const [files, setFiles] = useState<InputFile[]>([]);
  const [state, setState] = useState(IDLE);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<{ project: UserProject; updated: boolean } | null>(null);
  // the project these files belong to, so a SAFE file added later updates it instead of adding another
  const current = useRef<UserProject | null>(null);

  const addToPortfolio = (out: PipelineResult, list: InputFile[]) => {
    const etabs = list.find((f) => f.role === 'etabs')!;
    const title = out.brief.title?.trim();
    const name = title && !GENERIC_TITLE.test(title) ? title : nameFromFile(etabs.name);
    const prev = current.current;
    let slug = prev?.slug;
    if (!slug) {
      const taken = new Set(all.map((p) => p.slug));
      const base = slugify(name);
      slug = base;
      for (let k = 2; taken.has(slug); k++) slug = `${base}-${k}`;
    }
    const project = toProject(prev?.title ?? name, slug, out.conv.json, out.brief, t.save, prev?.createdAt);
    try {
      save(project);
      current.current = project;
      setSaved({ project, updated: !!prev });
    } catch {
      setError('Browser storage is full. Export and remove older projects first.');
    }
  };

  const run = async (list: InputFile[]) => {
    if (!list.some((f) => f.role === 'etabs')) return;
    setBusy(true);
    setError('');
    setResult(null);
    setState(IDLE);
    try {
      const out = await runPipeline(list, (id, s) => setState((cur) => ({ ...cur, [id]: s })));
      setResult(out);
      addToPortfolio(out, list);
      requestAnimationFrame(() => document.getElementById('agent-save')?.scrollIntoView({ behavior: 'smooth' }));
    } catch (e) {
      const k = e instanceof Error ? e.message : '';
      setError(t.errors[k] ?? t.errors.other);
      setState(IDLE);
    } finally {
      setBusy(false);
    }
  };

  const add = async (picked: File[]) => {
    const read = await Promise.all(picked.filter((f) => f.size <= MAX_BYTES).map(readInput));
    // a new ETABS model starts a new project
    if (read.some((r) => r.role === 'etabs')) {
      current.current = null;
      setSaved(null);
    }
    const next = [...files.filter((c) => !read.some((r) => r.name === c.name) && !(c.role === 'etabs' && read.some((r) => r.role === 'etabs'))), ...read];
    setFiles(next);
    setError('');
    if (read.some((r) => r.role === 'etabs' || r.role === 'safe')) await run(next);
  };

  const title = saved?.project.shortTitle ?? 'Project';
  const spec = useMemo(() => (result ? specFromModel(result.conv.json, 'import-preview', 'import-preview', title) : null), [result, title]);
  const hasEtabs = files.some((f) => f.role === 'etabs');

  return (
    <>
      <Seo title={tools.seo.importer.title} description={tools.seo.importer.description} noindex />
      <section className="wrap pb-14 pt-[calc(var(--header-h)+72px)] sm:pt-[calc(var(--header-h)+112px)]">
        <p className="label mb-8">{t.label}</p>
        <h1 className="sr-only">{t.label}</h1>
        <LineReveal lines={[t.lineA, <span key="2" className="text-bone-mute">{t.lineB}</span>]} className="display h-xl" />
        <FadeUp delay={0.25}>
          <p className="lede mt-10 max-w-[66ch]">{t.intro}</p>
        </FadeUp>
      </section>

      <section className="wrap pb-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <FilePicker files={files} onAdd={add} onRemove={(n) => setFiles((cur) => cur.filter((c) => c.name !== n))} />
          <div className="flex flex-col gap-5">
            <AgentCards state={state} ms={result?.ms} />
            {!hasEtabs && files.length > 0 && <p className="text-[14px] text-bone-mute">{t.needEtabs}</p>}
            {busy && (
              <p className="label animate-pulse text-bone" aria-live="polite">
                {t.state.running}
              </p>
            )}
            {error && (
              <p role="alert" className="border border-[#e07a5f]/40 px-4 py-3 text-[14px] text-[#e07a5f]">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>

      {result && spec && (
        <div className="wrap pb-24">
          {saved && (
            <Report id="agent-save" n="✓" title={t.save.title}>
              <SavedProject project={saved.project} updated={saved.updated} />
            </Report>
          )}
          <Report id="agent-reader" n="01" title={`${t.agents.reader.name} · ${t.agents.reader.role}`}>
            <ReaderReport brief={result.brief} />
          </Report>
          <Report id="agent-checker" n="02" title={`${t.agents.checker.name} · ${t.agents.checker.role}`}>
            <CheckerReport rules={result.rules} />
          </Report>
          <Report id="agent-builder" n="03" title={`${t.agents.builder.name} · ${t.agents.builder.role}`}>
            <BuilderReport spec={spec} rows={result.rows} title={title} exploreHref={saved ? lp(`/explorer?b=b-${saved.project.slug}`) : undefined} />
          </Report>
        </div>
      )}
    </>
  );
}
