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
      },
    },
    ssr: {
      external: ['@phosphor-icons/react'],
    },
  },
});
