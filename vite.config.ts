import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import path from 'path';
import { publishProjects } from './config/publish-plugin.ts';
import { siteUrl } from './config/site-url.ts';

// canonical and Open Graph links need the absolute address; on Vercel it comes from the project's
// production domain when VITE_SITE_URL is not set (see config/site-url.ts)
const site = siteUrl(import.meta.dirname);
if (site) process.env.VITE_SITE_URL = site;

// `vite preview` sends the same security headers as Vercel, so the production build is tested under them
type VercelHeaders = { headers: { source: string; headers: { key: string; value: string }[] }[] };
const vercel = JSON.parse(readFileSync(path.resolve(import.meta.dirname, 'vercel.json'), 'utf8')) as VercelHeaders;
const securityHeaders = Object.fromEntries(
  (vercel.headers.find((h) => h.source === '/(.*)')?.headers ?? []).map((h) => [h.key, h.value]),
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), publishProjects(import.meta.dirname)],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    // no public source maps: the source stays in the private repository
    sourcemap: false,
    rolldownOptions: {
      output: {
        // Shared code in named chunks. A group also takes in the packages its modules import, so the
        // packages every page needs (React, router, store) get the highest priority: otherwise React's
        // scheduler, imported by the 3D renderer too, would be pulled into the three.js chunk and every
        // page would download three.js.
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              priority: 4,
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|zustand|clsx|tailwind-merge|use-sync-external-store)[\\/]/,
            },
            { name: 'motion', priority: 3, test: /[\\/]node_modules[\\/](motion|motion-dom|motion-utils|framer-motion)[\\/]/ },
            { name: 'ui', priority: 3, test: /[\\/]node_modules[\\/]lucide-react[\\/]/ },
            {
              name: 'three',
              priority: 1,
              test: /[\\/]node_modules[\\/](three|three-[^\\/]+|@react-three[\\/][^\\/]+|postprocessing|n8ao|maath|camera-controls|troika-[^\\/]+|detect-gpu|stats-gl|hls\.js|its-fine|react-use-measure|suspend-react|meshline|@monogrid[\\/][^\\/]+|@mediapipe[\\/][^\\/]+|tunnel-rat|@use-gesture[\\/][^\\/]+|react-reconciler)[\\/]/,
            },
          ],
        },
      },
    },
    // the three.js chunk (~1.4 MB, ~460 kB gzip) only loads with the lazy 3D views
    chunkSizeWarningLimit: 1500,
  },
  optimizeDeps: {
    include: ['three'],
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 4173,
    headers: securityHeaders,
  },
});
