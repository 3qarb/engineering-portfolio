import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return;
          // 3D first: '@react-three' would otherwise match the 'react' test below
          if (/three|@react-three|postprocessing|n8ao|maath|camera-controls|troika|detect-gpu|stats-gl|hls.js/.test(id)) return 'three';
          if (id.includes('/motion/') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion';
          if (id.includes('lucide-react')) return 'ui';
          return 'vendor';
        },
      },
    },
    // the three.js chunk (~1.4 MB, ~460 kB gzip) only loads with the lazy 3D views
    chunkSizeWarningLimit: 1500,
  },
  optimizeDeps: {
    include: ['three', 'framer-motion'],
  },
  server: {
    port: 3000,
  },
});