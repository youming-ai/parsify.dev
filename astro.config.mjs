import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://parsify.dev',
  output: 'static',
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // Homepage is the most important; the AI hub is the second-tier landing
      // page; tool routes are the long-tail.
      serialize(item) {
        if (item.url === 'https://parsify.dev/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        if (item.url === 'https://parsify.dev/ai/' || item.url === 'https://parsify.dev/ai') {
          return { ...item, priority: 0.9, changefreq: 'weekly' };
        }
        return { ...item, priority: 0.8, changefreq: 'monthly' };
      },
    }),
  ],
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
