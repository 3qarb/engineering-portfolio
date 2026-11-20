import { useEffect } from 'react';
import { useDocumentLang } from '../../i18n/useDocumentLang';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useProjectsStore } from '../../store/projectsStore';
import { basePath, useT } from '../../i18n';

/** The first page paints at once (good for LCP); later route changes fade in. */
let firstPage = true;

export function MainLayout() {
  const { pathname } = useLocation();
  const t = useT();
  const loadPublished = useProjectsStore((s) => s.loadPublished);
  const page = basePath(pathname);
  const isExplorer = page.startsWith('/explorer');
  useDocumentLang();

  useEffect(() => {
    void loadPublished();
    firstPage = false;
  }, [loadPublished]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        {t.common.skip}
      </a>
      <Header />
      <motion.main
        id="main"
        key={page}
        tabIndex={-1}
        className="flex-1 outline-none"
        initial={firstPage ? false : { opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4 } }}
      >
        <Outlet />
      </motion.main>
      {!isExplorer && <Footer home={page === '/'} />}
    </div>
  );
}
