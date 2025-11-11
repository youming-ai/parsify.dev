/**
 * Lighthouse CI configuration for performance testing
 * Defines performance budgets and testing parameters
 */

module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000', 'http://localhost:3000/tools'],
      numberOfRuns: 3,
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'categories:pwa': 'off',

        // Performance budgets
        'first-contentful-paint': ['warn', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'speed-index': ['warn', { maxNumericValue: 2500 }],
        'interactive': ['warn', { maxNumericValue: 3000 }],

        // Resource budgets
        'performance-budget:script-size': ['warn', { maxNumericValue: 350 * 1024 }],
        'performance-budget:total-byte-weight': ['warn', { maxNumericValue: 1500 * 1024 }],
        'performance-budget:resource-count': ['warn', { maxNumericValue: 50 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
