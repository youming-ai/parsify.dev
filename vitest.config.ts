import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import {
  coverageConfig,
  componentCoverageThresholds,
} from "./src/__tests__/coverage.config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/vitest.setup.ts"],
    globals: true,
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: [
      "node_modules/",
      "dist/",
      ".next/",
      "coverage/",
      "**/*.config.*",
      "**/*.stories.*",
    ],
    coverage: {
      ...coverageConfig,
      thresholds: {
        ...coverageConfig.thresholds,
        ...componentCoverageThresholds,
      },
      // Additional coverage settings for comprehensive testing
      all: true,
      clean: true,
      cleanOnRerun: true,
      reportOnFailure: true,
      src: ["src"],
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "src/**/*.d.ts",
        "src/**/*.config.*",
        "src/**/*.stories.*",
        "src/**/*.test.*",
        "src/**/*.spec.*",
        "coverage/**",
        "dist/**",
        ".next/**",
        ".output/**",
        "*.config.*",
        "vitest.config.*",
        "package.json",
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "README.md",
        "CHANGELOG.md",
        "LICENSE",
        ".gitignore",
        ".eslintrc.*",
        ".prettierrc.*",
        "tailwind.config.*",
        "tsconfig.json",
        "next.config.*",
      ],
    },
    // Test timeout settings
    testTimeout: 10000,
    hookTimeout: 10000,
    // Retry failed tests
    retry: 2,
    // Reporter configuration
    reporter: ["verbose", "json", "html"],
    outputFile: {
      json: "./test-results/results.json",
      html: "./test-results/index.html",
    },
    // Watch mode settings
    watch: false,
    watchExclude: ["node_modules/**", "dist/**", "coverage/**"],
    // Global settings
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    // Isolate tests for better reliability
    isolate: true,
    // Environment settings
    env: {
      NODE_ENV: "test",
    },
    // Clear mocks between tests
    clearMocks: true,
    restoreMocks: true,
    // Fake timers
    useFakeTimers: true,
    // Sequence settings for deterministic test execution
    sequence: {
      shuffle: false,
      concurrent: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Define global constants for tests
    __DEV__: true,
    __TEST__: true,
  },
  // Optimize for test performance
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@testing-library/react",
      "@testing-library/jest-dom",
      "vitest",
    ],
  },
});
