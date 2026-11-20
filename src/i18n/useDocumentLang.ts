import { useEffect } from 'react';
import { useLang } from './lang';

/** Keeps <html lang dir> in step with the address. */
export function useDocumentLang() {
  const lang = useLang();
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);
}
