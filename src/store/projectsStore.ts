import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { projects as builtInProjects, type ProjectEntry } from '../data/projects';
import { buildings as builtInBuildings } from '../data/buildings';
import type { BuildingSpec } from '../lib/structure/types';

/** A project added from the site's editor. */
export interface UserProject extends ProjectEntry {
  userCreated: true;
  building?: BuildingSpec;
  /** JPEG snapshot of the 3D model, made in the editor */
  render?: string;
  createdAt: string;
}

interface ProjectsState {
  userProjects: UserProject[];
  /** Loaded at runtime from /data/projects.json, the published copy */
  published: UserProject[];
  save: (p: UserProject) => void;
  remove: (slug: string) => void;
  importMany: (list: UserProject[]) => number;
  loadPublished: () => Promise<void>;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || `project-${Date.now()}`;

function isUserProject(x: unknown): x is UserProject {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.slug === 'string' && typeof o.title === 'string';
}

function normalise(x: UserProject): UserProject {
  return {
    ...x,
    userCreated: true,
    id: x.id || x.slug,
    shortTitle: x.shortTitle || x.title,
    images: Array.isArray(x.images) ? x.images : [],
    responsibilities: Array.isArray(x.responsibilities) ? x.responsibilities : [],
    challenges: Array.isArray(x.challenges) ? x.challenges : [],
    solutions: Array.isArray(x.solutions) ? x.solutions : [],
    software: Array.isArray(x.software) ? x.software : [],
    drawings: Array.isArray(x.drawings) ? x.drawings : [],
    createdAt: x.createdAt || new Date().toISOString(),
  };
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      userProjects: [],
      published: [],
      save: (p) =>
        set((s) => {
          const rest = s.userProjects.filter((x) => x.slug !== p.slug);
          return { userProjects: [normalise(p), ...rest] };
        }),
      remove: (slug) => set((s) => ({ userProjects: s.userProjects.filter((x) => x.slug !== slug) })),
      importMany: (list) => {
        const valid = list.filter(isUserProject).map(normalise);
        const slugs = new Set(valid.map((v) => v.slug));
        set((s) => ({ userProjects: [...valid, ...s.userProjects.filter((x) => !slugs.has(x.slug))] }));
        return valid.length;
      },
      loadPublished: async () => {
        if (get().published.length) return;
        try {
          const res = await fetch('/data/projects.json', { cache: 'no-cache' });
          if (!res.ok) return;
          const json: unknown = await res.json();
          if (Array.isArray(json)) set({ published: json.filter(isUserProject).map(normalise) });
        } catch {
          /* no published file yet */
        }
      },
    }),
    {
      name: 'ak-portfolio-projects',
      version: 1,
      partialize: (s) => ({ userProjects: s.userProjects }),
    },
  ),
);

export type AnyProject = ProjectEntry & Partial<Pick<UserProject, 'userCreated' | 'building' | 'createdAt' | 'render'>>;

/** Built-in, published and browser-saved projects, newest additions first. */
export function useAllProjects(): AnyProject[] {
  const user = useProjectsStore((s) => s.userProjects);
  const published = useProjectsStore((s) => s.published);
  return useMemo(() => {
    const seen = new Set<string>();
    const out: AnyProject[] = [];
    for (const p of [...user, ...published, ...builtInProjects]) {
      if (seen.has(p.slug)) continue;
      seen.add(p.slug);
      out.push(p);
    }
    return out;
  }, [user, published]);
}

/** Lay out added buildings in rows behind the built-in site. */
function placeAdded(spec: BuildingSpec, i: number): BuildingSpec {
  return { ...spec, site: { x: -22 + (i % 3) * 24, z: 40 + Math.floor(i / 3) * 26 } };
}

export function useAllBuildings(): BuildingSpec[] {
  const all = useAllProjects();
  return useMemo(() => {
    const added = all
      .filter((p) => p.userCreated && p.building)
      .map((p, i) => placeAdded({ ...p.building!, projectSlug: p.slug, id: `b-${p.slug}` }, i));
    return [...builtInBuildings, ...added];
  }, [all]);
}

export function exportProjects(list: UserProject[]) {
  const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'projects.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
