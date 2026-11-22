// The portfolio entry for a project added from its model files: only what the model says, plus the owner's defaults.
import type { ToolStrings } from '../../i18n/tools';
import type { UserProject } from '../../store/projectsStore';
import type { ImportedModelJson } from '../structure/imported';
import type { ProjectBrief } from './understand';

const f1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString('en-US');

/** "villa-master copy (2).$et" → "Villa Master" */
export function nameFromFile(file: string): string {
  const base = file
    .replace(/\.[^.]+$/, '')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\(\d+\)|\bcopy\b|\bfinal\b|\brev\s*\d*\b|\bv\d+\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (base || 'Project').replace(/\b\p{Ll}/gu, (c) => c.toUpperCase());
}

/**
 * The project entry, written only from what the model says.
 * Name: the model title (ETABS TITLE2) or the file name. Client and role: the owner's defaults.
 */
export function toProject(name: string, slug: string, model: ImportedModelJson, brief: ProjectBrief, t: ToolStrings['importer']['save'], createdAt?: string): UserProject {
  const title = name.trim().slice(0, 140);
  return {
    id: slug,
    slug,
    title,
    shortTitle: title.slice(0, 60),
    category: 'Structural analysis and design',
    location: '',
    client: t.defaultClient,
    // the model does not say when the project was done; left for the owner to add
    period: '',
    status: 'completed',
    role: t.defaultRole,
    kind: 'project',
    thumbnail: '',
    images: [],
    overview: `${brief.system.en}.`,
    engineeringContext: brief.system.en,
    technical: [
      { label: 'Stories', value: String(brief.stories.length) },
      { label: 'Footprint', value: `${f1(brief.footprint.w)} × ${f1(brief.footprint.d)} m` },
      { label: 'Height above base', value: `${f1(brief.height)} m` },
      ...(brief.materials.fc ? [{ label: 'Concrete', value: `f′c ${f1(brief.materials.fc)} MPa` }] : []),
      ...(brief.code ? [{ label: 'Design code', value: brief.code }] : []),
    ],
    responsibilities: [],
    challenges: [],
    structuralAssessment: '',
    methodology: '',
    solutions: [],
    software: model.meta.sources.some((s) => /\.(\$sf|f2k)$/i.test(s)) ? ['ETABS', 'SAFE'] : ['ETABS'],
    drawings: [],
    featured: false,
    userCreated: true,
    model,
    createdAt: createdAt ?? new Date().toISOString(),
  };
}
