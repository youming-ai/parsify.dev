import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [react(), tailwind({ applyBaseStyles: false })],
  vite: {
    resolve: {
      alias: {
        '@': '/src',
        // Cloudflare Workers runtime does not expose MessageChannel, which the
        // default react-dom/server.browser build relies on via the scheduler
        // package. Use the edge build (Web Streams based) for SSR instead.
        'react-dom/server': 'react-dom/server.edge',
      },
    },
    ssr: {
      external: ['@phosphor-icons/react'],
    },
  },
});
