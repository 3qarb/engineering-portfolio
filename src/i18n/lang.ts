import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export type Lang = 'en' | 'ar';

/** The language is part of the address: English at "/", Arabic under "/ar". */
export const langOf = (pathname: string): Lang => (pathname === '/ar' || pathname.startsWith('/ar/') ? 'ar' : 'en');

/** Path without the language prefix, always starting with "/". */
export const basePath = (pathname: string) => (langOf(pathname) === 'ar' ? pathname.slice(3) || '/' : pathname);

export const withLang = (path: string, lang: Lang) => (lang === 'ar' ? `/ar${path === '/' ? '' : path}` : path);

export function useLang(): Lang {
  return langOf(useLocation().pathname);
}

/** Build a link inside the current language: lp('/projects') → '/ar/projects' on Arabic pages. */
export function useLocalePath() {
  const lang = useLang();
  return useCallback((path: string) => withLang(path, lang), [lang]);
}

/** The same page in the other language. */
export function useAlternatePath() {
  const { pathname, search, hash } = useLocation();
  const lang = langOf(pathname);
  return withLang(basePath(pathname), lang === 'ar' ? 'en' : 'ar') + search + hash;
}
