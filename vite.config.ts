/// <reference types="vitest" />

import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// `npm run dev` calls the local backend over http (http://localhost:8000), but
// index.html's CSP only allows https: connections. Widen it for the dev server only.
const devLocalApiCsp = (): Plugin => ({
  name: 'dev-local-api-csp',
  apply: 'serve',
  transformIndexHtml: (html) =>
    html.replace("data: blob: https:;", "data: blob: https: http://localhost:8000;"),
});

export default defineConfig({
  plugins: [react(), devLocalApiCsp()],
  base: './',
  // react-router v5 imports CJS prop-types; pre-bundle them so a mid-session
  // dep re-optimization can't leave a stale react-router chunk.
  optimizeDeps: {
    include: ['prop-types', 'react-router', 'react-router-dom'],
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Keep React, Ionic and the router together to prevent instance duplication.
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('@ionic')
            ) {
              return 'vendor-app-core';
            }
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
