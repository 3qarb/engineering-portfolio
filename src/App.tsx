import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Index } from './pages/Index';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { NotFound } from './pages/NotFound';

const ExplorerPage = lazy(() => import('./pages/ExplorerPage').then((m) => ({ default: m.ExplorerPage })));
const RenderPage = lazy(() => import('./pages/RenderPage').then((m) => ({ default: m.RenderPage })));
const ProjectEditor = lazy(() => import('./pages/ProjectEditor').then((m) => ({ default: m.ProjectEditor })));
const CvPage = lazy(() => import('./pages/CvPage').then((m) => ({ default: m.CvPage })));

/** The same pages in both languages: English at "/", Arabic under "/ar". */
function pages(prefix: '' | '/ar') {
  return (
    <Route path={prefix || '/'} element={<MainLayout />} key={prefix || 'en'}>
      <Route index element={<Index />} />
      <Route path="projects" element={<Projects />} />
      <Route path="projects/new" element={<ProjectEditor />} />
      <Route path="projects/:slug" element={<ProjectDetail />} />
      <Route path="projects/:slug/edit" element={<ProjectEditor />} />
      <Route path="explorer" element={<ExplorerPage />} />
      <Route path="about" element={<About />} />
      <Route path="cv" element={<CvPage />} />
      <Route path="contact" element={<Contact />} />
      {/* old addresses */}
      <Route path="building-explorer/*" element={<Navigate to={`${prefix}/explorer`} replace />} />
      <Route path="experience" element={<Navigate to={`${prefix}/about`} replace />} />
      <Route path="skills" element={<Navigate to={`${prefix}/about`} replace />} />
      <Route path="gallery" element={<Navigate to={`${prefix}/projects`} replace />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="render/:id" element={<RenderPage />} />
          <Route path="cv/print" element={<CvPage print />} />
          <Route path="ar/cv/print" element={<CvPage print />} />
          {pages('/ar')}
          {pages('')}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
