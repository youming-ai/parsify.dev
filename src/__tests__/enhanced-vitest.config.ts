import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import {
  coverageConfig,
  componentCoverageThresholds,
} from "./coverage.config";

/**
 * Enhanced Vitest configuration for comprehensive testing suite
 * Supports unit tests, integration tests, and performance testing
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,

    // Comprehensive test file patterns
    include: [
      // Unit tests
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",

      // Integration tests
      "src/**/integration/**/*.test.{ts,tsx}",
      "src/**/integration/**/*.spec.{ts,tsx}",

      // Performance tests
      "src/**/performance/**/*.test.{ts,tsx}",
      "src/**/bench/**/*.test.{ts,tsx}",

      // Tool-specific tests
      "src/components/tools/**/*.test.{ts,tsx}",
      "src/app/tools/**/*.test.{ts,tsx}",

      // Utility tests
      "src/lib/**/*.test.{ts,tsx}",
      "src/hooks/**/*.test.{ts,tsx}",
    ],

    exclude: [
      "node_modules/",
      "dist/",
      ".next/",
      "coverage/",
      "**/*.config.*",
      "**/*.stories.*",
      "**/e2e/**", // Exclude E2E tests - handled by Playwright
    ],

    // Enhanced coverage configuration
    coverage: {
      ...coverageConfig,
      thresholds: {
        ...coverageConfig.thresholds,
        ...componentCoverageThresholds,
        // Global coverage thresholds for comprehensive testing
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },

      // Enhanced reporting
      all: true,
      clean: true,
      cleanOnRerun: true,
      reportOnFailure: true,

      // Comprehensive source mapping
      src: ["src"],
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "src/**/*.d.ts",
        "src/**/*.config.*",
        "src/**/*.stories.*",
        "src/**/*.test.*",
        "src/**/*.spec.*",
        "src/**/mocks/**",
        "src/**/fixtures/**",
        "coverage/**",
        "dist/**",
        ".next/**",
        ".output/**",
      ],

      // Multiple report formats for different stakeholders
      reporter: [
        "text",
        "text-summary",
        "json",
        "json-summary",
        "html",
        "lcov",
        "clover"
      ],

      // Detailed coverage reporting
      reportsDirectory: "coverage",

      // Per-file analysis for granular insights
      perFile: false,

      // Branch coverage for conditional logic
      branches: 75,

      // Function coverage for complete API testing
      functions: 85,

      // Line coverage for comprehensive testing
      lines: 85,

      // Statement coverage for complete execution paths
      statements: 85,
    },

    // Test execution configuration
    testTimeout: 15000, // Increased for complex integration tests
    hookTimeout: 15000,

    // Retry configuration for flaky tests
    retry: process.env.CI ? 3 : 1,

    // Comprehensive reporting
    reporter: [
      "verbose",
      "json",
      "html",
      "junit",
      ["json", { outputFile: "./test-results/results.json" }],
      ["html", { outputFile: "./test-results/index.html" }],
      ["junit", { outputFile: "./test-results/junit.xml" }],
    ],

    // Output configuration
    outputFile: {
      json: "./test-results/results.json",
      html: "./test-results/index.html",
      junit: "./test-results/junit.xml",
    },

    // Watch mode for development
    watch: !process.env.CI,
    watchExclude: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "test-results/**"
    ],

    // Performance configuration
    threads: true,
    maxThreads: process.env.CI ? 2 : 4,
    minThreads: 1,

    // Test isolation
    isolate: true,
    singleThread: false,

    // Environment configuration
    env: {
      NODE_ENV: "test",
      CI: process.env.CI || "false",
      NEXT_PUBLIC_TEST_MODE: "true",
    },

    // Mock management
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,

    // Timer configuration
    useFakeTimers: false, // Use real timers for integration tests

    // Test sequence
    sequence: {
      shuffle: !process.env.CI, // Shuffle in development for flaky test detection
      concurrent: true,
      seed: process.env.VITEST_SEED ? parseInt(process.env.VITEST_SEED) : undefined,
    },

    // Global test setup
    globalSetup: "./src/__tests__/global-setup.ts",
    globalTeardown: "./src/__tests__/global-teardown.ts",

    // File parallelization
    fileParallelism: true,

    // Logging configuration
    logHeapUsage: true,
    isolate: true,

    // Bail configuration - stop on failure
    bail: process.env.CI ? 5 : 0,

    // Pass-through environment variables
    passWithNoTests: false,

    // Changed files configuration
    changed: process.env.CI ? false : undefined,

    // Diff configuration
    diff: "git",

    // Suppress deprecation warnings
    suppressWarnings: false,

    // Verbose output
    verbose: process.env.CI || false,

    // Allow only/skip
    allowOnly: !process.env.CI,

    // Environment snapshot
    dangerousIgnoreModuleIds: [],
  },

  // Resolve configuration
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@__tests__": path.resolve(__dirname, "./src/__tests__"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@app": path.resolve(__dirname, "./src/app"),
    },
  },

  // Define global constants
  define: {
    __DEV__: "true",
    __TEST__: "true",
    __VERSION__: JSON.stringify(process.env.npm_package_version || "1.0.0"),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@testing-library/react",
      "@testing-library/jest-dom",
      "@testing-library/user-event",
      "vitest",
      "jsdom",
    ],
    exclude: [
      "@monaco-editor/react",
      "monaco-editor",
    ],
  },

  // CSS processing
  css: {
    modules: {
      classNameStrategy: "stable",
    },
  },

  // Server configuration for integration tests
  server: {
    deps: {
      inline: [
        "@testing-library/react",
        "@testing-library/jest-dom",
      ],
    },
  },

  // Benchmark configuration
  benchmark: {
    include: ["**/*.{bench,benchmark}.{js,ts}"],
    exclude: ["node_modules", "dist", ".next"],
    outputFile: "./test-results/benchmark.json",
  },
});
