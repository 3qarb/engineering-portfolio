import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Download, Send } from 'lucide-react';
import { exportProjects, type UserProject } from '../../store/projectsStore';
import { useLocalePath } from '../../i18n';
import { useTools } from '../../i18n/tools';

/** What happened after the agents ran: the project is already in the portfolio. */
export function SavedProject({ project, updated }: { project: UserProject; updated: boolean }) {
  const t = useTools().importer;
  const lp = useLocalePath();
  const [msg, setMsg] = useState('');

  const publish = async () => {
    try {
      const res = await fetch('/__portfolio/publish', { method: 'POST', headers: { 'content-type': 'application/json', 'x-portfolio-publish': '1' }, body: JSON.stringify(project) });
      const out = (await res.json()) as { ok: boolean; file?: string };
      setMsg(out.ok ? t.save.published(out.file ?? 'public/data/projects.json') : t.save.publishFail);
    } catch {
      setMsg(t.save.publishFail);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="lede max-w-[66ch]" role="status">
        {updated ? t.save.updated(project.title) : t.save.added(project.title)}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Link to={lp(`/projects/${project.slug}`)} className="btn-solid">
          {t.save.view}
        </Link>
        <Link to={lp(`/explorer?b=b-${project.slug}`)} className="btn-ghost">
          <Box className="h-4 w-4" /> {t.builder.open3d}
        </Link>
        {import.meta.env.DEV && (
          <button type="button" className="btn-ghost" onClick={publish}>
            <Send className="h-4 w-4" /> {t.save.publish}
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={() => exportProjects([project])}>
          <Download className="h-4 w-4" /> {t.save.download}
        </button>
      </div>
      {msg && <p className="text-[14px] text-bone">{msg}</p>}
      <p className="max-w-[66ch] text-[13px] text-bone-mute">{t.save.publishNote}</p>
    </div>
  );
}
