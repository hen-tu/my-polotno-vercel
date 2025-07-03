import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'PolotnoApp',
      fileName: 'bundle',
      formats: ['iife'],
    },
    sourcemap: true,
    minify: false, // 👈 Add this line here
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});