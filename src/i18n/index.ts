import { useMemo } from 'react';
import { profile } from '../data/profile';
import { experience } from '../data/experience';
import { expertise, software } from '../data/skills';
import type { ProjectEntry } from '../data/projects';
import { en, type Strings } from './strings';
import { ar } from './strings-ar';
import { experienceAr, expertiseAr, profileAr, projectsAr, softwareAr } from './content-ar';
import { useLang, type Lang } from './lang';

export { useLang, useLocalePath, useAlternatePath, langOf, withLang, basePath, type Lang } from './lang';

export const dictionaries: Record<Lang, Strings> = { en, ar };

export function useT(): Strings {
  return dictionaries[useLang()];
}

export function useProfile() {
  const lang = useLang();
  return useMemo(() => {
    if (lang === 'en') return profile;
    return {
      ...profile,
      ...profileAr,
      currentCompany: { ...profile.currentCompany, ...profileAr.currentCompany },
      about: { ...profile.about, ...profileAr.about },
    };
  }, [lang]);
}

export function useExperience() {
  const lang = useLang();
  return useMemo(
    () => (lang === 'en' ? experience : experience.map((e) => ({ ...e, ...(experienceAr[e.id] ?? {}) }))),
    [lang],
  );
}

export function useExpertise() {
  const lang = useLang();
  return useMemo(() => (lang === 'en' ? expertise : expertise.map((g) => ({ ...g, ...(expertiseAr[g.id] ?? {}) }))), [lang]);
}

export function useSoftware() {
  const lang = useLang();
  return useMemo(() => (lang === 'en' ? software : software.map((s) => ({ ...s, use: softwareAr[s.name] ?? s.use }))), [lang]);
}

/** A project in the page language. Projects without an Arabic version stay in English. */
export function localizeProject<T extends ProjectEntry>(p: T, lang: Lang): T {
  if (lang === 'en') return p;
  const o = projectsAr[p.id];
  return o ? { ...p, ...o } : p;
}

export function useLocalized<T extends ProjectEntry>(list: T[]): T[] {
  const lang = useLang();
  return useMemo(() => list.map((p) => localizeProject(p, lang)), [list, lang]);
}
