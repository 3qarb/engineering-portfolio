// ETABS Model Report reader used by scripts/import-etabs.mjs (the .$et / .$sf readers moved to
// src/lib/import/etabs.ts, shared with the browser).
//   readReport(lines)   text of an ETABS "Model Report" PDF (lengths in m) — issued sections
//   pdfLines(path)      text of a PDF, line by line (needs the dev dependency pdfjs-dist)
import { readFileSync } from 'node:fs';

/** Issued sections from an ETABS Model Report (Tables 1.1, 3.2 and 3.3). */
export function readReport(lines) {
  const out = { program: '', date: '', frames: [], areas: [], stories: [] };
  let table = '';
  for (const line of lines) {
    const v = line.match(/^(ETABS v[\d.]+)/);
    if (v) out.program = v[1];
    if (!out.date && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(line)) out.date = line;
    const t = line.match(/^Table (\d+\.\d+) - /);
    if (t) { table = t[1]; continue; }
    if (table === '1.1') {
      const m = line.match(/^T1 (\S+) ([\d.]+) /);
      if (m) out.stories.push({ name: m[1], height: Number(m[2]) });
    } else if (table === '3.2') {
      const m = line.match(/^(\S+) (\S+) (\d+) (Column|Beam|Brace) ([\d.]+) ((?:COL|B|BEAM) \S+(?: [HV] \d+T\d+)?) /);
      if (m) out.frames.push({ story: m[1], label: m[2], type: m[4], section: m[6] });
    } else if (table === '3.3') {
      const m = line.match(/^(\S+) (\S+) (\d+) (.+) (Slab|Wall|Deck)$/);
      if (m) out.areas.push({ story: m[1], label: m[2], section: m[4] });
    }
  }
  return out;
}

export async function pdfLines(path) {
  let pdfjs;
  try {
    pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch {
    throw new Error('Reading a PDF report needs the dev dependency: npm install -D pdfjs-dist');
  }
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(path)), useSystemFonts: true }).promise;
  const out = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    const rows = new Map();
    for (const it of tc.items) {
      const y = Math.round(it.transform[5]);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push({ x: it.transform[4], s: it.str });
    }
    for (const [, r] of [...rows.entries()].sort((a, b) => b[0] - a[0])) {
      const line = r.sort((a, b) => a.x - b.x).map((c) => c.s).join(' ').replace(/\s+/g, ' ').trim();
      if (line) out.push(line);
    }
  }
  return out;
}
