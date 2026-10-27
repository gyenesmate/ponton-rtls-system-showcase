import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/main.js'),
      output: {
        entryFileNames: 'rtls-showcase.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'rtls-showcase.css';
          }
          return 'assets/[name][extname]';
        },
        format: 'es',
        inlineDynamicImports: true
      }
    }
  },
  server: {
    open: '/preview.html'
  }
});
