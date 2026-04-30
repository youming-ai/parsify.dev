import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

// Production builds target Cloudflare Workers (workerd), whose runtime does not
// expose MessageChannel — the global react-dom/server.browser pulls in via the
// scheduler package. Aliasing react-dom/server to react-dom/server.edge fixes
// the worker bundle, but in dev mode Vite's SSR module runner loads files as
// ESM on Node, and react-dom/server.edge.js uses CommonJS `require()`, which
// blows up at startup. Apply the alias only during `astro build`.
const reactDomServerEdgeAliasForBuild = {
  name: 'react-dom-server-edge-alias-for-build',
  apply: 'build',
  enforce: 'pre',
  config: () => ({
    resolve: {
      alias: {
        'react-dom/server': 'react-dom/server.edge',
      },
    },
  }),
};

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
    plugins: [reactDomServerEdgeAliasForBuild],
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
