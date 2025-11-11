/**
 * Cross-browser E2E Testing Configuration
 * Extends base configuration with comprehensive browser and device coverage
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Cross-browser test configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Global test configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Enhanced reporting for cross-browser testing
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/cross-browser-results.json' }],
    ['junit', { outputFile: 'test-results/cross-browser-results.xml' }],
    ['list']
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),

  // Shared settings for all projects
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Enhanced timeout settings for cross-browser testing
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Viewport and device emulation
    viewport: null, // Allow per-project viewport settings

    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',

    // User agent
    userAgent: undefined, // Use browser defaults

    // Ignore HTTPS errors for testing
    ignoreHTTPSErrors: true,

    // Color scheme preference
    colorScheme: 'light',
    reducedMotion: 'reduce',

    // Media features
    hasTouch: undefined, // Determined per device
  },

  // Cross-browser projects configuration
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-extensions',
            '--no-sandbox',
            '--disable-dev-shm-usage'
          ]
        }
      },
      testMatch: '**/*.spec.ts',
      testIgnore: '**/mobile-only.spec.ts',
    },

    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'security.fileuri.strict_origin_policy': false,
            'browser.cache.disk.enable': false,
            'browser.cache.memory.enable': false,
          }
        }
      },
      testMatch: '**/*.spec.ts',
      testIgnore: '**/mobile-only.spec.ts',
    },

    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        }
      },
      testMatch: '**/*.spec.ts',
      testIgnore: '**/mobile-only.spec.ts',
    },

    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        hasTouch: true,
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        }
      },
      testMatch: '**/*mobile*.spec.ts',
      testIgnore: '**/desktop-only.spec.ts',
    },

    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        hasTouch: true,
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        }
      },
      testMatch: '**/*mobile*.spec.ts',
      testIgnore: '**/desktop-only.spec.ts',
    },

    // Tablet browsers
    {
      name: 'tablet-chrome',
      use: {
        ...devices['iPad Pro'],
        hasTouch: true,
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        }
      },
      testMatch: '**/*tablet*.spec.ts',
      testIgnore: '**/mobile-only.spec.ts',
    },

    // Edge browser
    {
      name: 'edge-desktop',
      use: {
        ...devices['Desktop Edge'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-extensions'
          ]
        }
      },
      testMatch: '**/*.spec.ts',
      testIgnore: '**/mobile-only.spec.ts',
    },

    // Dark mode testing
    {
      name: 'chromium-dark-mode',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        reducedMotion: 'reduce',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--force-dark-mode',
            '--enable-features=WebContentsForceDark'
          ]
        }
      },
      testMatch: '**/*dark*.spec.ts',
      dependencies: ['chromium-desktop'],
    },

    // Reduced motion testing
    {
      name: 'chromium-reduced-motion',
      use: {
        ...devices['Desktop Chrome'],
        reducedMotion: 'reduce',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--force-prefers-reduced-motion'
          ]
        }
      },
      testMatch: '**/*accessibility*.spec.ts',
      dependencies: ['chromium-desktop'],
    },

    // High DPI display testing
    {
      name: 'chromium-high-dpi',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 2,
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--force-device-scale-factor=2'
          ]
        }
      },
      testMatch: '**/*responsive*.spec.ts',
      dependencies: ['chromium-desktop'],
    },

    // Low bandwidth simulation
    {
      name: 'chromium-slow-network',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        }
      },
      testMatch: '**/*performance*.spec.ts',
      dependencies: ['chromium-desktop'],
    },

    // Legacy browser support
    {
      name: 'chromium-legacy',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-blink-features=AutomationControlled',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          ]
        }
      },
      testMatch: '**/*compatibility*.spec.ts',
      dependencies: ['chromium-desktop'],
    },

    // CI-specific optimized configurations
    ...(process.env.CI ? [
      {
        name: 'ci-chromium-stable',
        use: {
          ...devices['Desktop Chrome'],
          launchOptions: {
            args: [
              '--disable-web-security',
              '--disable-features=IsolateOrigins,site-per-process',
              '--disable-dev-shm-usage',
              '--no-sandbox',
              '--headless'
            ]
          }
        },
        testMatch: '**/smoke.spec.ts',
        retries: 1,
      }
    ] : []),

    // Development configuration
    ...(process.env.NODE_ENV === 'development' ? [
      {
        name: 'dev-chromium-debug',
        use: {
          ...devices['Desktop Chrome'],
          headless: false,
          slowMo: 100,
          launchOptions: {
            args: [
              '--disable-web-security',
              '--disable-features=IsolateOrigins,site-per-process',
              '--auto-open-devtools-for-tabs'
            ]
          }
        },
        testMatch: '**/debug*.spec.ts',
        retries: 0,
      }
    ] : [])
  ],

  // Web server configuration
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Metadata for test organization
  metadata: {
    'Test Environment': process.env.NODE_ENV || 'test',
    'Browser Coverage': ['Chrome', 'Firefox', 'Safari', 'Edge'],
    'Device Coverage': ['Desktop', 'Mobile', 'Tablet'],
    'Feature Coverage': [
      'Homepage Discovery',
      'Search Functionality',
      'Filter Workflows',
      'Category Navigation',
      'Responsive Design',
      'Accessibility',
      'Performance'
    ]
  },

  // Global test configuration
  grep: new RegExp(process.env.GREP || '.*'),
  grepInvert: new RegExp(process.env.GREP_INVERT || '^$'),

  // Timeout configuration
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  // Output directory
  outputDir: 'test-results/cross-browser',
});
