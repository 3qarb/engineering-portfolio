import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/strings';
import { ar } from '../src/i18n/strings-ar';
import { buildingNamesAr, experienceAr, expertiseAr, projectsAr, softwareAr } from '../src/i18n/content-ar';
import { profile } from '../src/data/profile';
import { experience } from '../src/data/experience';
import { expertise, software } from '../src/data/skills';
import { projects } from '../src/data/projects';
import { buildings } from '../src/data/buildings';

/** Every key path of an object; functions and arrays are leaves. */
function keys(o: unknown, prefix = ''): string[] {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return [prefix];
  return Object.entries(o).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}
const at = (o: unknown, path: string) => path.split('.').reduce<unknown>((x, p) => (x as Record<string, unknown>)[p], o);

describe('Arabic interface text', () => {
  it('has exactly the English keys', () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
  });
  it('has no empty strings', () => {
    expect(keys(ar).filter((k) => at(ar, k) === '')).toEqual([]);
  });
});

describe('Arabic content overlays', () => {
  it('cover every built-in project, role, area, program and building', () => {
    for (const p of projects) expect(projectsAr[p.id], p.id).toBeDefined();
    for (const e of experience) expect(experienceAr[e.id], e.id).toBeDefined();
    for (const g of expertise) {
      expect(expertiseAr[g.id], g.id).toBeDefined();
      expect(expertiseAr[g.id].items).toHaveLength(g.items.length);
    }
    for (const s of software) expect(softwareAr[s.name], s.name).toBeDefined();
    for (const b of buildings) expect(buildingNamesAr[b.id], b.id).toBeDefined();
  });
  it('keep list lengths in step with English', () => {
    for (const p of projects) {
      const o = projectsAr[p.id];
      if (o.responsibilities) expect(o.responsibilities, p.id).toHaveLength(p.responsibilities.length);
      if (o.scope) expect(o.scope, p.id).toHaveLength(p.scope?.length ?? 0);
      if (o.technical) expect(o.technical, p.id).toHaveLength(p.technical?.length ?? 0);
      if (o.challenges) expect(o.challenges, p.id).toHaveLength(p.challenges.length);
      if (o.drawings) expect(o.drawings, p.id).toHaveLength(p.drawings.length);
    }
    expect(experienceAr['ikk-group'].responsibilities).toHaveLength(experience[0].responsibilities.length);
  });
});

describe('content accuracy guards', () => {
  it('dates the IKK role from 2025', () => {
    expect(profile.currentCompany.startDate).toBe('2025');
    expect(experience.find((e) => e.id === 'ikk-group')?.startDate).toBe('2025');
  });
  it('contains no template placeholders', () => {
    const text = JSON.stringify({ profile, experience, projects, expertise, software });
    expect(text).not.toMatch(/\[(Previous|Responsibility|Technology|Start Date|End Date)/);
  });
  it('labels every study as illustrative and links every model to a project', () => {
    for (const p of projects.filter((x) => x.kind === 'study')) expect(p.status).toBe('study');
    const slugs = new Set(projects.map((p) => p.slug));
    for (const b of buildings) {
      expect(slugs.has(b.projectSlug), b.id).toBe(true);
      const project = projects.find((p) => p.slug === b.projectSlug)!;
      // only an imported model of a real project may claim project basis
      if (b.basis === 'project') {
        expect(b.imported, b.id).toBeDefined();
        expect(project.kind, b.id).toBe('project');
      } else expect(project.kind, b.id).toBe('study');
    }
  });
});
