import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
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
