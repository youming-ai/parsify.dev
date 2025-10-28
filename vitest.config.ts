import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts', './tests/unit/components/test-setup.tsx'],
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules/', 'specs/**/*', '**/*.d.ts', '**/*.config.*', 'dist/', 'build/'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'specs/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'build/',
        '**/*.stories.*',
        '**/*.spec.*',
        '**/*.test.*',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/web': resolve(__dirname, './apps/web/src'),
      '@/api': resolve(__dirname, './apps/api/src'),
      '@/shared': resolve(__dirname, './packages'),
    },
  },
})
