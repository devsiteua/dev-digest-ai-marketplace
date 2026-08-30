import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base: GitHub Pages serves this repository under a sub-path, and the
// app uses hash routing because Pages has no rewrite rule for unknown paths.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
