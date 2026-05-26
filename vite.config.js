import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  root: '.',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: 'localhost',
    open: true,
  },
});
