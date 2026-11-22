#!/usr/bin/env node
// Import a real ETABS (+ SAFE) model into the portfolio's 3D explorer format.
//
//   node scripts/import-etabs.mjs --et "<model.$et or .e2k>" [--report "<Model Report.pdf>"] \
//        [--safe "<foundation.$sf>"] [--source "label shown on the site"] \
//        [--files "names shown as sources, separated by |"] --out src/data/models/<id>.json
//
// The reading and conversion are the same code the site's Add-project page runs in the browser
// (src/lib/import/convert.ts; Node 22.18+ loads the TypeScript directly). When a Model Report PDF is
// given, member sections are taken from it instead (the report is what was issued), keyed by
// story + object label. Output is in metres, plan centred on the building, world axes
// x = ETABS X, z = −ETABS Y (north away from the default camera), y up.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { convertModel } from '../src/lib/import/convert.ts';
import { pdfLines, readReport } from './etabs/readers.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
if (!args.et || !args.out) {
  console.error('usage: node scripts/import-etabs.mjs --et <model.$et> [--report <report.pdf>] [--safe <found.$sf>] --out <file.json>');
  process.exit(1);
}

const report = args.report ? readReport(await pdfLines(args.report)) : null;
let issued;
if (report) {
  issued = new Map();
  for (const f of report.frames) issued.set(`${f.story}|${f.label}`, f.section);
  for (const a of report.areas) issued.set(`${a.story}|${a.label}`, a.section);
}

const { json, skipped } = convertModel({
  etText: readFileSync(args.et, 'utf8'),
  safeText: args.safe ? readFileSync(args.safe, 'utf8') : undefined,
  source: args.source || report?.program,
  fileNames: args.files ? args.files.split('|') : [args.et, args.report, args.safe].filter(Boolean).map((p) => basename(p)),
  issued,
});
json.meta.reportDate = report?.date || null;
json.meta.importedAt = new Date().toISOString().slice(0, 10);

mkdirSync(dirname(args.out), { recursive: true });
writeFileSync(args.out, JSON.stringify(json));
console.log(
  `wrote ${args.out}: ${json.columns.length} column segments, ${json.beams.length} beams, ${json.slabs.length} slab panels, ` +
    `${json.walls?.length ?? 0} walls, ${json.inclined?.length ?? 0} ramps/stairs, ${json.footings.length} footings, ${json.straps.length} strap beams; ` +
    `${json.meta.sectionsChangedFromModelFile} sections taken from the report`,
);
for (const s of skipped) console.log(`  not drawn: ${s.what} (${s.count})`);
