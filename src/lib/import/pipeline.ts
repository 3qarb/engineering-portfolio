// The Add-project pipeline: Reader → Checker → Builder, run in the browser on the owner's files.
// Nothing is uploaded; the files are read with the File API and stay on the device.
import type { ImportedModelJson } from '../structure/imported';
import { buildImported } from '../structure/imported';
import type { BuildingSpec, ImportedBuilding } from '../structure/types';
import { runChecks, type RuleResult } from './checks';
import { convertModel, type ConvertResult } from './convert';
import { detectRole, type FileRole } from './etabs';
import { takeoff, type TakeoffRow } from './takeoff';
import { understand, type ProjectBrief } from './understand';

export interface InputFile {
  name: string;
  size: number;
  role: FileRole;
  text?: string;
}

export type AgentId = 'reader' | 'checker' | 'builder';

export interface PipelineResult {
  conv: ConvertResult;
  built: ImportedBuilding & { levelNames: string[] };
  brief: ProjectBrief;
  rules: RuleResult[];
  rows: TakeoffRow[];
  ms: Record<AgentId, number>;
}

/** Reads a dropped file: text for ETABS/SAFE exports, nothing for binaries and drawings. */
export async function readInput(file: File): Promise<InputFile> {
  const head = await file.slice(0, 4096).text().catch(() => '');
  const role = detectRole(file.name, head);
  const text = role === 'etabs' || role === 'safe' ? await file.text() : undefined;
  return { name: file.name, size: file.size, role, text };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

export async function runPipeline(files: InputFile[], onStage: (id: AgentId, state: 'running' | 'done') => void): Promise<PipelineResult> {
  const et = files.find((f) => f.role === 'etabs');
  if (!et?.text) throw new Error('no-etabs');
  const safe = files.find((f) => f.role === 'safe');
  const ms = { reader: 0, checker: 0, builder: 0 };

  onStage('reader', 'running');
  await tick();
  let t = performance.now();
  const conv = convertModel({
    etText: et.text,
    safeText: safe?.text,
    fileNames: [et.name, safe?.name].filter(Boolean) as string[],
  });
  if (!conv.json.levels.length || (!conv.json.columns.length && !conv.json.beams.length && !conv.json.slabs.length)) throw new Error('empty-model');
  conv.json.meta.importedAt = new Date().toISOString().slice(0, 10);
  const built = buildImported(conv.json);
  const brief = understand(conv, built.elements, built.bounds);
  ms.reader = performance.now() - t;
  onStage('reader', 'done');

  onStage('checker', 'running');
  await tick();
  t = performance.now();
  const rules = runChecks(conv.json, built.elements, brief.combos);
  ms.checker = performance.now() - t;
  onStage('checker', 'done');

  onStage('builder', 'running');
  await tick();
  t = performance.now();
  const rows = takeoff(built.elements);
  ms.builder = performance.now() - t;
  onStage('builder', 'done');

  return { conv, built, brief, rules, rows, ms };
}

/** An imported model as a building on the explorer site. */
export function specFromModel(model: ImportedModelJson, id: string, projectSlug: string, name: string): BuildingSpec {
  const built = buildImported(model);
  return {
    id,
    projectSlug,
    name,
    system: 'rc-frame',
    floors: Math.max(1, built.levelNames.length),
    storeyHeight: built.bounds.h / Math.max(1, built.levelNames.length),
    baysX: [built.bounds.w],
    baysZ: [built.bounds.d],
    site: { x: 0, z: 0 },
    basis: 'project',
    levelNames: built.levelNames,
    imported: built,
  };
}
