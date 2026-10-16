import { defineConfig } from 'vite';

// Relative base so dist/ works when dropped anywhere (Netlify drop, subfolders).
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 1800 },
  worker: { format: 'es' },
});
