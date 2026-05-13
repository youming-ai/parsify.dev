export default {
  spa: {
    enabled: true,
  },
  prerender: {
    enabled: true,
    crawlLinks: true,
  },
  pages: [
    { path: '/' },
    { path: '/404' },
    { path: '/ai' },
    { path: '/ai/cost-calculator' },
    { path: '/ai/cache-calculator' },
  ],
};
