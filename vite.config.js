import { defineConfig } from 'vite';

// Deployed at https://briandaviddavidson.com/nobel/
export default defineConfig({
  root: 'src',
  base: '/nobel/',
  publicDir: false,
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
