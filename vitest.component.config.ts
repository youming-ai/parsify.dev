import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/unit/components/test-setup.tsx'],
    include: ['tests/unit/components/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: [
      'node_modules/',
      'specs/**/*',
      '**/*.d.ts',
      '**/*.config.*',
      'dist/',
      'build/',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['tests/unit/components/**/*'],
      exclude: [
        'node_modules/',
        'specs/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'build/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/web': resolve(__dirname, './apps/web/src'),
      '@/api': resolve(__dirname, './apps/api/src'),
      '@/shared': resolve(__dirname, './packages'),
      '@/components': resolve(__dirname, './apps/web/src/components'),
      '@/lib': resolve(__dirname, './apps/web/src/lib'),
    },
  },
})
