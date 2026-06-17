import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [
    ...(mode !== 'development' ? [cloudflare()] : []),
    TanStackRouterVite(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '~': '/src',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}));
