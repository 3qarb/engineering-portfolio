import { useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import type { InputFile } from '../../lib/import/pipeline';
import { useTools } from '../../i18n/tools';
import { cn } from '../../utils/cn';

const ACCEPT = '.$et,.e2k,.$sf,.f2k,.edb,.fdb';
const kb = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} kB`);

/** The "send the project file" button and drop zone. Files are read locally. */
export function FilePicker({ files, onAdd, onRemove }: { files: InputFile[]; onAdd: (f: File[]) => void; onRemove: (name: string) => void }) {
  const t = useTools().importer;
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onAdd([...e.dataTransfer.files]);
        }}
        className={cn('flex flex-col items-center gap-4 border border-dashed px-6 py-12 text-center transition-colors', over ? 'border-sand bg-white/[0.04]' : 'border-white/20')}
      >
        <button type="button" className="btn-solid" onClick={() => input.current?.click()}>
          <Upload className="h-4 w-4" /> {t.choose}
        </button>
        <p className="text-[14px] text-bone-dim">{t.drop}</p>
        <p className="label text-bone-mute" dir="ltr">
          {t.accepts}
        </p>
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-label={t.choose}
          onChange={(e) => {
            onAdd([...(e.target.files ?? [])]);
            e.target.value = '';
          }}
        />
      </div>
      <p className="mt-3 text-[13px] text-bone-mute">{t.privacy}</p>

      {files.length > 0 && (
        <ul className="mt-6 flex flex-col">
          {files.map((f) => {
            const ok = f.role === 'etabs' || f.role === 'safe';
            return (
              <li key={f.name} className="flex items-center gap-4 border-b border-white/[0.07] py-3">
                <FileText className={cn('h-4 w-4 shrink-0', ok ? 'text-sand' : 'text-bone-mute')} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[13px] text-bone" dir="ltr">
                    {f.name}
                  </p>
                  <p className={cn('text-[13px]', ok ? 'text-bone-dim' : 'text-bone-mute')}>
                    {t.roles[f.role]} · {kb(f.size)}
                  </p>
                </div>
                <button type="button" onClick={() => onRemove(f.name)} className="grid h-10 w-10 place-items-center text-bone-mute hover:text-bone" aria-label={`${t.remove} ${f.name}`}>
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <details className="mt-6 text-[14px] text-bone-dim">
        <summary className="label cursor-pointer text-bone">{t.howTitle}</summary>
        <ul className="mt-3 flex list-disc flex-col gap-2 ps-5">
          {t.how.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
