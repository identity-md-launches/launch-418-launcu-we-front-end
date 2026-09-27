import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the export works from any subpath (gateway, ENS, file server).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
