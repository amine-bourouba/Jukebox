/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: './node_modules/.vite',
  define: {
    // Ensure React loads its development build during tests so that act() works.
    // In all other modes (dev/production) keep the mode value as-is.
    'process.env.NODE_ENV': JSON.stringify(mode === 'test' ? 'test' : mode === 'production' ? 'production' : 'development'),
  },
  server: {
    port: 8000,
    host: 'localhost',
  },
  preview: {
    port: 8000,
    host: 'localhost',
  },
  plugins: [
    react()
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8'
    },
  },
}));
