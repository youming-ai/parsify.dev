import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [tanstackStart(), tailwindcss(), cloudflare({
    viteEnvironment: {
      name: "ssr"
    }
  })],
  resolve: {
    alias: {
      '~': '/src',
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // "use client" directives from Radix UI / TanStack packages are safe to ignore
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        // Unused imports inside TanStack Start's own bundles — not our code
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        warn(warning);
      },
    },
  },
});