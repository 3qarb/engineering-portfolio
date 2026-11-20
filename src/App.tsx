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

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="render/:id" element={<RenderPage />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Index />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/new" element={<ProjectEditor />} />
            <Route path="projects/:slug" element={<ProjectDetail />} />
            <Route path="projects/:slug/edit" element={<ProjectEditor />} />
            <Route path="explorer" element={<ExplorerPage />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            {/* old addresses */}
            <Route path="building-explorer/*" element={<Navigate to="/explorer" replace />} />
            <Route path="experience" element={<Navigate to="/about" replace />} />
            <Route path="skills" element={<Navigate to="/about" replace />} />
            <Route path="gallery" element={<Navigate to="/projects" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
