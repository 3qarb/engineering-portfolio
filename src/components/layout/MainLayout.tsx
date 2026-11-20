import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useProjectsStore } from '../../store/projectsStore';

export function MainLayout() {
  const { pathname } = useLocation();
  const loadPublished = useProjectsStore((s) => s.loadPublished);
  const isExplorer = pathname.startsWith('/explorer');

  useEffect(() => {
    void loadPublished();
  }, [loadPublished]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <motion.main
        id="main"
        key={pathname}
        tabIndex={-1}
        className="flex-1 outline-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.5 } }}
      >
        <Outlet />
      </motion.main>
      {!isExplorer && <Footer />}
    </div>
  );
}
