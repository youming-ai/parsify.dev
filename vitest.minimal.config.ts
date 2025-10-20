import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/**/*.{test,spec}.{js,ts}',
    ],
    exclude: [
      'node_modules/',
      'specs/**/*',
      '**/*.d.ts',
      '**/*.config.*',
      'dist/',
      'build/'
    ],
  },
})