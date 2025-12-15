/**
 * Vite Configuration
 *
 * Bundler configuration for renderer process (React)
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  // Root directory for Vite (renderer process)
  root: 'renderer',

  // Plugins
  plugins: [react()],

  // Build configuration
  build: {
    outDir: '../dist/renderer',
    emptyOutDir: true,
    // Optimize for Electron renderer
    target: 'esnext',
    rollupOptions: {
      input: join(__dirname, 'renderer', 'index.html'),
    },
  },

  // Dev server configuration
  server: {
    port: 5173,
    strictPort: false, // Auto-select alternative port if 5173 is occupied
  },

  // Base path
  base: './',
});
