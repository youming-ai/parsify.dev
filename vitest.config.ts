import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',

    // Global test setup
    globals: true,
    setupFiles: ['./tests/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'dist/',
        '.next/',
        'public/',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },

    // Test performance and timeout
    testTimeout: 10000, // 10 seconds for individual tests
    hookTimeout: 15000, // 15 seconds for hooks
    maxConcurrency: 4,

    // Reporting
    reporters: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/results.html',
    },

    // Watch mode
    watch: false,

    // Include/exclude patterns
    include: [
      'tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    exclude: ['node_modules/', 'dist/', '.next/', '**/*.d.ts'],
  },

  // Resolve paths for imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tests': resolve(__dirname, './tests'),
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', 'clsx', 'tailwind-merge'],
  },
});
