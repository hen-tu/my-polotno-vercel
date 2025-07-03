import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/main.jsx',
      name: 'PolotnoApp',
      fileName: 'bundle',
      formats: ['iife'],
    },
    sourcemap: true,
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});