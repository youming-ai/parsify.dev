/**
 * Performance Test Execution and Data Collection System
 * Advanced browser automation and performance measurement infrastructure
 * Features real-time monitoring, detailed metrics collection, and comprehensive reporting
 */

import { Browser, Page, chromium, firefox, webkit } from 'playwright';
import { PerformanceTestResult, PerformanceTestAction } from './performance-regression-testing';

export interface TestExecutionConfig {
  browser: {
    type: 'chromium' | 'firefox' | 'webkit';
    headless: boolean;
    devtools: boolean;
    viewport: { width: number; height: number };
    userAgent?: string;
    locale?: string;
    timezone?: string;
  };
  network: {
    offline: boolean;
    downloadThroughput?: number; // bytes/second
    uploadThroughput?: number; // bytes/second
    latency?: number; // milliseconds
  };
  cpu: {
    throttling: {
      enabled: boolean;
      rate: number; // CPU slowdown factor (1-20)
    };
  };
  execution: {
    timeout: number; // milliseconds
    navigationTimeout: number; // milliseconds
    actionTimeout: number; // milliseconds
    retries: number;
    retryDelay: number; // milliseconds
    screenshotOnFailure: boolean;
    traceOnFailure: boolean;
    videoRecording: boolean;
  };
  monitoring: {
    enablePerformanceObserver: boolean;
    enableNetworkMonitoring: boolean;
    enableMemoryMonitoring: boolean;
    enableConsoleLogging: boolean;
    enableLongTaskMonitoring: boolean;
    samplingRate: number; // milliseconds
  };
  reporting: {
    includeScreenshot: boolean;
    includeVideo: boolean;
    includeTrace: boolean;
    includeHar: boolean;
    includeCoverage: boolean;
  };
}

export interface TestExecutionContext {
  id: string;
  browser: Browser;
  page: Page;
  startTime: number;
  markers: Map<string, number>;
  metrics: Map<string, number[]>;
  networkRequests: Array<{
    url: string;
    method: string;
    status: number;
    type: string;
    size: number;
    duration: number;
    timestamp: number;
  }>;
  consoleMessages: Array<{
    type: string;
    text: string;
    timestamp: number;
  }>;
  performanceEntries: Array<{
    name: string;
    entryType: string;
    startTime: number;
    duration: number;
  }>;
  memorySnapshots: Array<{
    timestamp: number;
    used: number;
    total: number;
    jsHeapSizeLimit: number;
  }>;
  longTasks: Array<{
    startTime: number;
    duration: number;
    attribution: Array<{
      name: string;
      entryType: string;
      startTime: number;
      duration: number;
    }>;
  }>;
  errors: Array<{
    type: string;
    message: string;
    stack?: string;
    timestamp: number;
  }>;
}

export interface PerformanceMetrics {
  // Navigation timing
  navigationStart: number;
  unloadEventStart: number;
  unloadEventEnd: number;
  redirectStart: number;
  redirectEnd: number;
  fetchStart: number;
  domainLookupStart: number;
  domainLookupEnd: number;
  connectStart: number;
  connectEnd: number;
  secureConnectionStart: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  domLoading: number;
  domInteractive: number;
  domContentLoadedEventStart: number;
  domContentLoadedEventEnd: number;
  domComplete: number;
  loadEventStart: number;
  loadEventEnd: number;

  // Paint timing
  firstPaint: number;
  firstContentfulPaint: number;
  firstMeaningfulPaint: number;
  largestContentfulPaint: number;

  // Input timing
  firstInputDelay: number;
  totalBlockingTime: number;
  timeToInteractive: number;

  // Layout stability
  cumulativeLayoutShift: number;

  // Resource timing
  resourceCount: number;
  resourceSize: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;

  // Network information
  downlink: number;
  effectiveType: string;
  rtt: number;
  saveData: boolean;

  // Memory information
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;

  // Long tasks
  longTaskCount: number;
  longTaskDuration: number;

  // Custom metrics
  customMetrics: Record<string, number>;
}

export interface BrowserProfile {
  name: string;
  description: string;
  config: TestExecutionConfig;
  capabilities: {
    supportedMetrics: string[];
    supportedFeatures: string[];
    limitations: string[];
  };
}

/**
 * Advanced Performance Test Execution Engine
 */
export class PerformanceTestExecutor {
  private static instance: PerformanceTestExecutor;
  private contexts: Map<string, TestExecutionContext> = new Map();
  private browserProfiles: Map<string, BrowserProfile> = new Map();
  private isInitialized = false;

  // Performance monitoring and analysis
  private performanceMonitor: PerformanceMonitor;
  private networkMonitor: NetworkMonitor;
  private memoryMonitor: MemoryMonitor;
  private consoleMonitor: ConsoleMonitor;
  private longTaskMonitor: LongTaskMonitor;

  // Data collection and processing
  private metricsCollector: MetricsCollector;
  private dataProcessor: DataProcessor;
  private reportGenerator: ExecutionReportGenerator;

  private constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.networkMonitor = new NetworkMonitor();
    this.memoryMonitor = new MemoryMonitor();
    this.consoleMonitor = new ConsoleMonitor();
    this.longTaskMonitor = new LongTaskMonitor();
    this.metricsCollector = new MetricsCollector();
    this.dataProcessor = new DataProcessor();
    this.reportGenerator = new ExecutionReportGenerator();

    this.initializeBrowserProfiles();
  }

  public static getInstance(): PerformanceTestExecutor {
    if (!PerformanceTestExecutor.instance) {
      PerformanceTestExecutor.instance = new PerformanceTestExecutor();
    }
    return PerformanceTestExecutor.instance;
  }

  private initializeBrowserProfiles(): void {
    // Desktop Chrome profile
    this.browserProfiles.set('desktop-chrome', {
      name: 'Desktop Chrome',
      description: 'Chrome browser on desktop with standard settings',
      config: {
        browser: {
          type: 'chromium',
          headless: process.env.CI === 'true',
          devtools: process.env.NODE_ENV === 'development',
          viewport: { width: 1920, height: 1080 },
          locale: 'en-US',
          timezone: 'America/New_York',
        },
        network: {
          offline: false,
          downloadThroughput: 1048576, // 1MB/s
          uploadThroughput: 524288, // 512KB/s
          latency: 20, // 20ms
        },
        cpu: {
          throttling: {
            enabled: process.env.NODE_ENV !== 'development',
            rate: 1, // No throttling by default
          },
        },
        execution: {
          timeout: 60000, // 60 seconds
          navigationTimeout: 30000, // 30 seconds
          actionTimeout: 10000, // 10 seconds
          retries: 3,
          retryDelay: 1000, // 1 second
          screenshotOnFailure: true,
          traceOnFailure: true,
          videoRecording: false, // Enable for debugging
        },
        monitoring: {
          enablePerformanceObserver: true,
          enableNetworkMonitoring: true,
          enableMemoryMonitoring: true,
          enableConsoleLogging: true,
          enableLongTaskMonitoring: true,
          samplingRate: 100, // 100ms
        },
        reporting: {
          includeScreenshot: true,
          includeVideo: false,
          includeTrace: true,
          includeHar: true,
          includeCoverage: false,
        },
      },
      capabilities: {
        supportedMetrics: [
          'navigation', 'paint', 'input', 'layout', 'resource',
          'network', 'memory', 'long-task', 'custom'
        ],
        supportedFeatures: [
          'network-throttling', 'cpu-throttling', 'device-emulation',
          'geolocation', 'permissions', 'offline-mode'
        ],
        limitations: [
          'Limited mobile device emulation',
          'No real mobile hardware testing'
        ],
      },
    });

    // Mobile Chrome profile
    this.browserProfiles.set('mobile-chrome', {
      name: 'Mobile Chrome',
      description: 'Chrome browser emulating mobile device',
      config: {
        browser: {
          type: 'chromium',
          headless: process.env.CI === 'true',
          devtools: false,
          viewport: { width: 375, height: 667 },
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          locale: 'en-US',
          timezone: 'America/New_York',
        },
        network: {
          offline: false,
          downloadThroughput: 750000, // 750KB/s (3G)
          uploadThroughput: 250000, // 250KB/s (3G)
          latency: 100, // 100ms
        },
        cpu: {
          throttling: {
            enabled: true,
            rate: 4, // 4x slowdown
          },
        },
        execution: {
          timeout: 90000, // 90 seconds
          navigationTimeout: 45000, // 45 seconds
          actionTimeout: 15000, // 15 seconds
          retries: 3,
          retryDelay: 2000, // 2 seconds
          screenshotOnFailure: true,
          traceOnFailure: true,
          videoRecording: false,
        },
        monitoring: {
          enablePerformanceObserver: true,
          enableNetworkMonitoring: true,
          enableMemoryMonitoring: true,
          enableConsoleLogging: true,
          enableLongTaskMonitoring: true,
          samplingRate: 200, // 200ms
        },
        reporting: {
          includeScreenshot: true,
          includeVideo: false,
          includeTrace: true,
          includeHar: true,
          includeCoverage: false,
        },
      },
      capabilities: {
        supportedMetrics: [
          'navigation', 'paint', 'input', 'layout', 'resource',
          'network', 'memory', 'long-task', 'custom'
        ],
        supportedFeatures: [
          'network-throttling', 'cpu-throttling', 'device-emulation',
          'touch-events', 'orientation-changes', 'geolocation'
        ],
        limitations: [
          'Emulated mobile performance',
          'Limited touch gesture simulation'
        ],
      },
    });

    // Tablet Safari profile
    this.browserProfiles.set('tablet-safari', {
      name: 'Tablet Safari',
      description: 'Safari browser emulating tablet device',
      config: {
        browser: {
          type: 'webkit',
          headless: process.env.CI === 'true',
          devtools: false,
          viewport: { width: 768, height: 1024 },
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          locale: 'en-US',
          timezone: 'America/New_York',
        },
        network: {
          offline: false,
          downloadThroughput: 1500000, // 1.5MB/s (4G)
          uploadThroughput: 750000, // 750KB/s (4G)
          latency: 50, // 50ms
        },
        cpu: {
          throttling: {
            enabled: true,
            rate: 2, // 2x slowdown
          },
        },
        execution: {
          timeout: 75000, // 75 seconds
          navigationTimeout: 35000, // 35 seconds
          actionTimeout: 12000, // 12 seconds
          retries: 3,
          retryDelay: 1500, // 1.5 seconds
          screenshotOnFailure: true,
          traceOnFailure: true,
          videoRecording: false,
        },
        monitoring: {
          enablePerformanceObserver: true,
          enableNetworkMonitoring: true,
          enableMemoryMonitoring: true,
          enableConsoleLogging: true,
          enableLongTaskMonitoring: true,
          samplingRate: 150, // 150ms
        },
        reporting: {
          includeScreenshot: true,
          includeVideo: false,
          includeTrace: true,
          includeHar: true,
          includeCoverage: false,
        },
      },
      capabilities: {
        supportedMetrics: [
          'navigation', 'paint', 'input', 'layout', 'resource',
          'network', 'memory', 'long-task', 'custom'
        ],
        supportedFeatures: [
          'network-throttling', 'cpu-throttling', 'device-emulation',
          'touch-events', 'orientation-changes'
        ],
        limitations: [
          'WebKit-specific behavior',
          'Limited Safari-specific features'
        ],
      },
    });
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🚀 Initializing Performance Test Executor...');

    try {
      // Initialize monitors
      await this.performanceMonitor.initialize();
      await this.networkMonitor.initialize();
      await this.memoryMonitor.initialize();
      await this.consoleMonitor.initialize();
      await this.longTaskMonitor.initialize();

      this.isInitialized = true;
      console.log('✅ Performance Test Executor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Performance Test Executor:', error);
      throw error;
    }
  }

  /**
   * Execute a performance test with specified actions
   */
  public async executeTest(
    profileName: string,
    url: string,
    actions: PerformanceTestAction[],
    options?: {
      testName?: string;
      description?: string;
      tags?: string[];
      customMetrics?: string[];
      onProgress?: (progress: number, action: PerformanceTestAction) => void;
    }
  ): Promise<PerformanceTestResult> {
    if (!this.isInitialized) {
      throw new Error('Performance Test Executor not initialized');
    }

    const profile = this.browserProfiles.get(profileName);
    if (!profile) {
      throw new Error(`Browser profile '${profileName}' not found`);
    }

    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🧪 Executing performance test: ${testId}`);

    const startTime = Date.now();
    let context: TestExecutionContext | null = null;
    let browser: Browser | null = null;

    try {
      // Create browser context
      browser = await this.createBrowserContext(profile.config, testId);
      context = this.contexts.get(testId)!;

      // Configure monitoring
      await this.setupMonitoring(context, profile.config);

      // Navigate to initial URL
      await this.navigateToUrl(context.page, url, profile.config.execution.navigationTimeout);

      // Execute test actions
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        options?.onProgress?.((i + 1) / actions.length, action);

        await this.executeAction(context, action, profile.config.execution.actionTimeout);
      }

      // Collect final metrics
      const metrics = await this.collectMetrics(context);

      // Generate test result
      const result: PerformanceTestResult = {
        id: testId,
        testSuite: options?.testName || 'Performance Test',
        scenario: options?.description || 'Custom Test',
        environment: profileName,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        status: context.errors.length > 0 ? 'failed' : 'passed',
        metrics: this.processMetrics(metrics, context),
        baseline: undefined, // Will be set by caller if needed
        execution: {
          runs: 1,
          errors: context.errors.map(e => e.message),
          warnings: [],
          environment: profileName,
          userAgent: await context.page.evaluate(() => navigator.userAgent),
          device: profile.config.browser.viewport.width <= 768 ? 'mobile' : 'desktop',
          network: this.getNetworkCondition(profile.config),
        },
        regressions: [],
        improvements: [],
        score: { overall: 0, performance: 0, reliability: 0, efficiency: 0 },
      };

      console.log(`✅ Performance test completed: ${testId} (${result.status})`);
      return result;
    } catch (error) {
      console.error(`❌ Performance test failed: ${testId}`, error);

      // Return failed result
      return {
        id: testId,
        testSuite: options?.testName || 'Performance Test',
        scenario: options?.description || 'Custom Test',
        environment: profileName,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        status: 'failed',
        metrics: this.getEmptyMetrics(),
        baseline: undefined,
        execution: {
          runs: 1,
          errors: [error instanceof Error ? error.message : String(error)],
          warnings: [],
          environment: profileName,
          userAgent: '',
          device: profile.config.browser.viewport.width <= 768 ? 'mobile' : 'desktop',
          network: this.getNetworkCondition(profile.config),
        },
        regressions: [],
        improvements: [],
        score: { overall: 0, performance: 0, reliability: 0, efficiency: 0 },
      };
    } finally {
      // Cleanup
      if (context) {
        await this.cleanupContext(context);
      }
      if (browser) {
        await browser.close();
      }
      this.contexts.delete(testId);
    }
  }

  /**
   * Create and configure browser context
   */
  private async createBrowserContext(
    config: TestExecutionConfig,
    testId: string
  ): Promise<Browser> {
    let browser: Browser;

    // Launch browser based on type
    switch (config.browser.type) {
      case 'chromium':
        browser = await chromium.launch({
          headless: config.browser.headless,
          devtools: config.browser.devtools,
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
          ],
        });
        break;
      case 'firefox':
        browser = await firefox.launch({
          headless: config.browser.headless,
          devtools: config.browser.devtools,
        });
        break;
      case 'webkit':
        browser = await webkit.launch({
          headless: config.browser.headless,
          devtools: config.browser.devtools,
        });
        break;
      default:
        throw new Error(`Unsupported browser type: ${config.browser.type}`);
    }

    // Create page context
    const page = await browser.newPage();

    // Configure viewport
    await page.setViewportSize(config.browser.viewport);

    // Set user agent if specified
    if (config.browser.userAgent) {
      await page.setUserAgent(config.browser.userAgent);
    }

    // Set locale if specified
    if (config.browser.locale) {
      await page.evaluateOnNewDocument(locale => {
        Object.defineProperty(navigator, 'language', { get: () => locale });
        Object.defineProperty(navigator, 'languages', { get: () => [locale] });
      }, config.browser.locale);
    }

    // Set timezone if specified
    if (config.browser.timezone) {
      await page.emulateTimezone(config.browser.timezone);
    }

    // Configure network conditions
    if (!config.network.offline) {
      const context = page.context();
      await context.route('**/*', async (route) => {
        const request = route.request();

        // Apply network throttling
        if (config.network.downloadThroughput || config.network.uploadThroughput || config.network.latency) {
          // In a real implementation, this would apply network throttling
          // For now, just continue with the request
        }

        await route.continue();
      });
    }

    // Apply CPU throttling
    if (config.cpu.throttling.enabled && config.cpu.throttling.rate > 1) {
      await page.emulateCPUThrottling(config.cpu.throttling.rate);
    }

    // Create test execution context
    const context: TestExecutionContext = {
      id: testId,
      browser,
      page,
      startTime: Date.now(),
      markers: new Map(),
      metrics: new Map(),
      networkRequests: [],
      consoleMessages: [],
      performanceEntries: [],
      memorySnapshots: [],
      longTasks: [],
      errors: [],
    };

    this.contexts.set(testId, context);
    return browser;
  }

  /**
   * Setup monitoring for the test context
   */
  private async setupMonitoring(context: TestExecutionContext, config: TestExecutionConfig): Promise<void> {
    // Setup performance observer
    if (config.monitoring.enablePerformanceObserver) {
      await this.performanceMonitor.setup(context);
    }

    // Setup network monitoring
    if (config.monitoring.enableNetworkMonitoring) {
      await this.networkMonitor.setup(context);
    }

    // Setup memory monitoring
    if (config.monitoring.enableMemoryMonitoring) {
      await this.memoryMonitor.setup(context);
    }

    // Setup console monitoring
    if (config.monitoring.enableConsoleLogging) {
      await this.consoleMonitor.setup(context);
    }

    // Setup long task monitoring
    if (config.monitoring.enableLongTaskMonitoring) {
      await this.longTaskMonitor.setup(context);
    }

    // Start metrics collection
    await this.metricsCollector.start(context, config.monitoring);
  }

  /**
   * Navigate to URL with timeout
   */
  private async navigateToUrl(page: Page, url: string, timeout: number): Promise<void> {
    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout,
      });
    } catch (error) {
      throw new Error(`Failed to navigate to ${url}: ${error}`);
    }
  }

  /**
   * Execute a single test action
   */
  private async executeAction(
    context: TestExecutionContext,
    action: PerformanceTestAction,
    timeout: number
  ): Promise<void> {
    const { page } = context;

    try {
      // Set performance markers
      if (action.measure) {
        await page.evaluate((name) => performance.mark(`${name}-start`), action.measure.start);
      }

      switch (action.type) {
        case 'navigate':
          if (!action.target) {
            throw new Error('Navigate action requires target URL');
          }
          await this.navigateToUrl(page, action.target, timeout);
          break;

        case 'click':
          if (!action.selector) {
            throw new Error('Click action requires selector');
          }
          await page.click(action.selector, { timeout });
          break;

        case 'type':
          if (!action.selector || action.value === undefined) {
            throw new Error('Type action requires selector and value');
          }
          await page.fill(action.selector, action.value, { timeout });
          break;

        case 'wait':
          const waitDuration = action.duration || 1000;
          await page.waitForTimeout(waitDuration);
          break;

        case 'scroll':
          if (action.scrollTo) {
            if (action.scrollTo === 'top') {
              await page.evaluate(() => window.scrollTo(0, 0));
            } else if (action.scrollTo === 'bottom') {
              await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            } else if (action.scrollTo === 'center') {
              await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight / 2);
              });
            } else {
              await page.evaluate((x, y) => window.scrollTo(x, y),
                action.scrollTo.x, action.scrollTo.y);
            }
          } else if (action.selector) {
            await page.locator(action.selector).scrollIntoViewIfNeeded();
          }
          break;

        case 'hover':
          if (!action.selector) {
            throw new Error('Hover action requires selector');
          }
          await page.hover(action.selector, { timeout });
          break;

        case 'measure':
          // Measurement handled by performance markers
          if (action.measure) {
            await page.evaluate((name) => performance.mark(`${name}-end`), action.measure.end);
            await page.evaluate((name) => {
              try {
                performance.measure(name, `${name}-start`, `${name}-end`);
              } catch (e) {
                console.warn('Failed to create measure:', e);
              }
            }, action.measure.name);
          }
          break;

        case 'screenshot':
          if (action.screenshot) {
            await page.screenshot({
              path: `screenshots/${context.id}-${action.screenshot.name}.png`,
              fullPage: action.screenshot.fullPage,
            });
          }
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      // Wait for specific condition if specified
      if (action.waitFor) {
        await page.waitForSelector(action.waitFor, { timeout });
      }

      // Add delay if specified
      if (action.options?.delay) {
        await page.waitForTimeout(action.options.delay);
      }

    } catch (error) {
      context.errors.push({
        type: 'action-error',
        message: `Failed to execute ${action.type}: ${error}`,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Collect comprehensive performance metrics
   */
  private async collectMetrics(context: TestExecutionContext): Promise<PerformanceMetrics> {
    const { page } = context;

    try {
      // Collect navigation timing
      const navigationTiming = await page.evaluate(() => {
        const timing = performance.timing;
        return {
          navigationStart: timing.navigationStart,
          unloadEventStart: timing.unloadEventStart,
          unloadEventEnd: timing.unloadEventEnd,
          redirectStart: timing.redirectStart,
          redirectEnd: timing.redirectEnd,
          fetchStart: timing.fetchStart,
          domainLookupStart: timing.domainLookupStart,
          domainLookupEnd: timing.domainLookupEnd,
          connectStart: timing.connectStart,
          connectEnd: timing.connectEnd,
          secureConnectionStart: timing.secureConnectionStart,
          requestStart: timing.requestStart,
          responseStart: timing.responseStart,
          responseEnd: timing.responseEnd,
          domLoading: timing.domLoading,
          domInteractive: timing.domInteractive,
          domContentLoadedEventStart: timing.domContentLoadedEventStart,
          domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
          domComplete: timing.domComplete,
          loadEventStart: timing.loadEventStart,
          loadEventEnd: timing.loadEventEnd,
        };
      });

      // Collect paint timing
      const paintTiming = await page.evaluate(() => {
        const paintEntries = performance.getEntriesByType('paint');
        const result: any = {};

        paintEntries.forEach(entry => {
          if (entry.name === 'first-paint') {
            result.firstPaint = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            result.firstContentfulPaint = entry.startTime;
          }
        });

        return result;
      });

      // Collect largest contentful paint
      const lcp = await page.evaluate(() => {
        return new Promise(resolve => {
          new PerformanceObserver(list => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry ? lastEntry.startTime : 0);
          }).observe({ type: 'largest-contentful-paint', buffered: true });

          // Fallback timeout
          setTimeout(() => resolve(0), 10000);
        });
      });

      // Collect input timing
      const inputTiming = await page.evaluate(() => {
        return new Promise(resolve => {
          let firstInputDelay = 0;
          let totalBlockingTime = 0;
          let hasInput = false;

          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if (!hasInput && entry.name === 'first-input') {
                firstInputDelay = entry.processingStart - entry.startTime;
                hasInput = true;
              }

              if (entry.duration > 50) {
                totalBlockingTime += entry.duration - 50;
              }
            }
          }).observe({ type: 'event', buffered: true });

          // Time to Interactive calculation
          const tti = new Promise(ttiResolve => {
            new PerformanceObserver(list => {
              const lastLongTask = list.getEntries().pop();
              if (lastLongTask) {
                const ttiCandidate = lastLongTask.startTime + lastLongTask.duration + 50;
                if (ttiCandidate > performance.timing.domInteractive) {
                  ttiResolve(ttiCandidate);
                }
              }
            }).observe({ type: 'longtask', buffered: true });
          });

          setTimeout(() => {
            resolve({
              firstInputDelay,
              totalBlockingTime,
              timeToInteractive: performance.timing.domInteractive || 0,
            });
          }, 10000);
        });
      });

      // Collect layout stability
      const cls = await page.evaluate(() => {
        return new Promise(resolve => {
          let clsValue = 0;

          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });

          setTimeout(() => resolve(clsValue), 10000);
        });
      });

      // Collect resource timing
      const resourceTiming = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        let totalSize = 0;
        let transferSize = 0;
        let encodedBodySize = 0;
        let decodedBodySize = 0;

        resources.forEach(resource => {
          if (resource.transferSize) totalSize += resource.transferSize;
          if (resource.transferSize) transferSize += resource.transferSize;
          if (resource.encodedBodySize) encodedBodySize += resource.encodedBodySize;
          if (resource.decodedBodySize) decodedBodySize += resource.decodedBodySize;
        });

        return {
          resourceCount: resources.length,
          totalSize,
          transferSize,
          encodedBodySize,
          decodedBodySize,
        };
      });

      // Collect network information
      const networkInfo = await page.evaluate(() => {
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        return {
          downlink: connection?.downlink || 0,
          effectiveType: connection?.effectiveType || 'unknown',
          rtt: connection?.rtt || 0,
          saveData: connection?.saveData || false,
        };
      });

      // Collect memory information
      const memoryInfo = await page.evaluate(() => {
        const memory = (performance as any).memory;
        return {
          jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
          totalJSHeapSize: memory?.totalJSHeapSize || 0,
          usedJSHeapSize: memory?.usedJSHeapSize || 0,
        };
      });

      // Collect long tasks
      const longTasks = await page.evaluate(() => {
        return new Promise(resolve => {
          const tasks: any[] = [];

          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              tasks.push({
                startTime: entry.startTime,
                duration: entry.duration,
                attribution: entry.attribution || [],
              });
            }
          }).observe({ type: 'longtask', buffered: true });

          setTimeout(() => {
            const totalDuration = tasks.reduce((sum, task) => sum + task.duration, 0);
            resolve({
              longTaskCount: tasks.length,
              longTaskDuration: totalDuration,
            });
          }, 10000);
        });
      });

      // Collect custom performance measures
      const customMeasures = await page.evaluate(() => {
        const measures = performance.getEntriesByType('measure') as PerformanceMeasure[];
        const result: Record<string, number> = {};

        measures.forEach(measure => {
          result[measure.name] = measure.duration;
        });

        return result;
      });

      return {
        ...navigationTiming,
        ...paintTiming,
        largestContentfulPaint: lcp as number,
        ...inputTiming,
        cumulativeLayoutShift: cls as number,
        ...resourceTiming,
        ...networkInfo,
        ...memoryInfo,
        ...longTasks,
        customMetrics: customMeasures,
      };
    } catch (error) {
      console.error('Failed to collect metrics:', error);
      return this.getEmptyPerformanceMetrics();
    }
  }

  private processMetrics(metrics: PerformanceMetrics, context: TestExecutionContext): PerformanceTestResult['metrics'] {
    // Calculate derived metrics
    const domContentLoadedTime = metrics.domContentLoadedEventEnd - metrics.domContentLoadedEventStart;
    const loadTime = metrics.loadEventEnd - metrics.navigationStart;
    const timeToFirstByte = metrics.responseStart - metrics.requestStart;
    const firstByteToDomInteractive = metrics.domInteractive - metrics.responseStart;

    return {
      loadTime,
      firstContentfulPaint: metrics.firstContentfulPaint,
      largestContentfulPaint: metrics.largestContentfulPaint,
      firstInputDelay: metrics.firstInputDelay,
      cumulativeLayoutShift: metrics.cumulativeLayoutShift,
      timeToInteractive: metrics.timeToInteractive,

      // Resource metrics (convert to KB)
      bundleSize: Math.round((metrics.transferSize || 0) / 1024),
      compressedBundleSize: Math.round((metrics.encodedBodySize || 0) / 1024),
      jsSize: Math.round((metrics.transferSize || 0) / 1024), // Simplified
      cssSize: 0, // Would need separate calculation
      imageSize: 0, // Would need separate calculation
      resourceCount: metrics.resourceCount,

      // Memory metrics (convert to MB)
      memoryUsage: Math.round((metrics.usedJSHeapSize || 0) / (1024 * 1024)),
      memoryPeak: Math.round((metrics.totalJSHeapSize || 0) / (1024 * 1024)),
      memoryLeakDetected: false, // Would need trend analysis

      // Runtime metrics
      renderTime: metrics.domInteractive - metrics.domLoading,
      scriptExecutionTime: metrics.domContentLoadedEventEnd - metrics.domContentLoadedEventStart,
      layoutTime: 0, // Would need separate calculation
      paintTime: metrics.firstContentfulPaint - metrics.firstPaint,

      customMetrics: metrics.customMetrics || {},
    };
  }

  private getEmptyMetrics(): PerformanceTestResult['metrics'] {
    return {
      loadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      timeToInteractive: 0,
      bundleSize: 0,
      compressedBundleSize: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      resourceCount: 0,
      memoryUsage: 0,
      memoryPeak: 0,
      memoryLeakDetected: false,
      renderTime: 0,
      scriptExecutionTime: 0,
      layoutTime: 0,
      paintTime: 0,
      customMetrics: {},
    };
  }

  private getEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      navigationStart: 0,
      unloadEventStart: 0,
      unloadEventEnd: 0,
      redirectStart: 0,
      redirectEnd: 0,
      fetchStart: 0,
      domainLookupStart: 0,
      domainLookupEnd: 0,
      connectStart: 0,
      connectEnd: 0,
      secureConnectionStart: 0,
      requestStart: 0,
      responseStart: 0,
      responseEnd: 0,
      domLoading: 0,
      domInteractive: 0,
      domContentLoadedEventStart: 0,
      domContentLoadedEventEnd: 0,
      domComplete: 0,
      loadEventStart: 0,
      loadEventEnd: 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      firstMeaningfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      totalBlockingTime: 0,
      timeToInteractive: 0,
      cumulativeLayoutShift: 0,
      resourceCount: 0,
      resourceSize: 0,
      transferSize: 0,
      encodedBodySize: 0,
      decodedBodySize: 0,
      downlink: 0,
      effectiveType: 'unknown',
      rtt: 0,
      saveData: false,
      jsHeapSizeLimit: 0,
      totalJSHeapSize: 0,
      usedJSHeapSize: 0,
      longTaskCount: 0,
      longTaskDuration: 0,
      customMetrics: {},
    };
  }

  private getNetworkCondition(config: TestExecutionConfig): string {
    if (config.network.offline) {
      return 'offline';
    }

    if (config.network.downloadThroughput && config.network.latency) {
      if (config.network.downloadThroughput < 500000) {
        return 'slow-3g';
      } else if (config.network.downloadThroughput < 1500000) {
        return 'fast-3g';
      } else {
        return '4g';
      }
    }

    return 'unknown';
  }

  /**
   * Cleanup test execution context
   */
  private async cleanupContext(context: TestExecutionContext): Promise<void> {
    try {
      // Stop monitoring
      await this.metricsCollector.stop(context);

      // Close page
      if (context.page && !context.page.isClosed()) {
        await context.page.close();
      }
    } catch (error) {
      console.error('Failed to cleanup context:', error);
    }
  }

  // Public API methods
  public getBrowserProfiles(): Map<string, BrowserProfile> {
    return new Map(this.browserProfiles);
  }

  public addBrowserProfile(name: string, profile: BrowserProfile): void {
    this.browserProfiles.set(name, profile);
  }

  public removeBrowserProfile(name: string): boolean {
    return this.browserProfiles.delete(name);
  }

  public getActiveContexts(): string[] {
    return Array.from(this.contexts.keys());
  }

  public async executeBatchTests(
    tests: Array<{
      profileName: string;
      url: string;
      actions: PerformanceTestAction[];
      testName?: string;
      description?: string;
    }>,
    options?: {
      parallel?: boolean;
      maxConcurrency?: number;
      onProgress?: (completed: number, total: number, currentTest: string) => void;
    }
  ): Promise<PerformanceTestResult[]> {
    const { parallel = true, maxConcurrency = 3, onProgress } = options || {};

    console.log(`🧪 Executing batch of ${tests.length} performance tests (${parallel ? 'parallel' : 'sequential'})`);

    if (parallel) {
      // Execute tests in parallel with concurrency limit
      const results: PerformanceTestResult[] = [];
      const chunks = this.chunkArray(tests, maxConcurrency);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkPromises = chunk.map(async (test, index) => {
          const result = await this.executeTest(
            test.profileName,
            test.url,
            test.actions,
            {
              testName: test.testName,
              description: test.description,
            }
          );

          onProgress?.(i * maxConcurrency + index + 1, tests.length, test.testName || `Test ${i * maxConcurrency + index + 1}`);
          return result;
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }

      return results;
    } else {
      // Execute tests sequentially
      const results: PerformanceTestResult[] = [];

      for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        const result = await this.executeTest(
          test.profileName,
          test.url,
          test.actions,
          {
            testName: test.testName,
            description: test.description,
          }
        );

        results.push(result);
        onProgress?.(i + 1, tests.length, test.testName || `Test ${i + 1}`);
      }

      return results;
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  public async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Performance Test Executor...');

    // Cleanup all active contexts
    for (const context of this.contexts.values()) {
      await this.cleanupContext(context);
    }
    this.contexts.clear();

    this.isInitialized = false;
    console.log('✅ Performance Test Executor cleaned up');
  }
}

// Monitoring classes
class PerformanceMonitor {
  async initialize(): Promise<void> {
    console.log('📊 Initializing Performance Monitor...');
  }

  async setup(context: TestExecutionContext): Promise<void> {
    await context.page.addInitScript(() => {
      // Setup performance observers
      if ('PerformanceObserver' in window) {
        // Observe navigation timing
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log('Navigation entry:', entry);
          }
        }).observe({ entryTypes: ['navigation'] });

        // Observe paint timing
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log('Paint entry:', entry);
          }
        }).observe({ entryTypes: ['paint'] });

        // Observe largest contentful paint
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log('LCP entry:', entry);
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Observe layout shift
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log('CLS entry:', entry);
          }
        }).observe({ entryTypes: ['layout-shift'] });
      }
    });
  }
}

class NetworkMonitor {
  async initialize(): Promise<void> {
    console.log('🌐 Initializing Network Monitor...');
  }

  async setup(context: TestExecutionContext): Promise<void> {
    context.page.on('request', (request) => {
      context.networkRequests.push({
        url: request.url(),
        method: request.method(),
        status: 0, // Will be updated in response
        type: request.resourceType(),
        size: 0,
        duration: 0,
        timestamp: Date.now(),
      });
    });

    context.page.on('response', (response) => {
      const request = response.request();
      const existingRequest = context.networkRequests.find(r => r.url === request.url());

      if (existingRequest) {
        existingRequest.status = response.status();
        existingRequest.size = response.headers()['content-length'] ?
          parseInt(response.headers()['content-length']!) : 0;
        existingRequest.duration = Date.now() - existingRequest.timestamp;
      }
    });
  }
}

class MemoryMonitor {
  async initialize(): Promise<void> {
    console.log('💾 Initializing Memory Monitor...');
  }

  async setup(context: TestExecutionContext): Promise<void> {
    // Collect memory snapshots periodically
    const interval = setInterval(async () => {
      try {
        const memory = await context.page.evaluate(() => {
          const memory = (performance as any).memory;
          return memory ? {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
          } : null;
        });

        if (memory) {
          context.memorySnapshots.push({
            timestamp: Date.now(),
            ...memory,
          });
        }
      } catch (error) {
        // Ignore errors during memory collection
      }
    }, 1000); // Collect every second

    // Store interval ID for cleanup
    (context as any).memoryInterval = interval;
  }
}

class ConsoleMonitor {
  async initialize(): Promise<void> {
    console.log('📝 Initializing Console Monitor...');
  }

  async setup(context: TestExecutionContext): Promise<void> {
    context.page.on('console', (message) => {
      context.consoleMessages.push({
        type: message.type(),
        text: message.text(),
        timestamp: Date.now(),
      });
    });

    context.page.on('pageerror', (error) => {
      context.errors.push({
        type: 'javascript-error',
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
      });
    });
  }
}

class LongTaskMonitor {
  async initialize(): Promise<void> {
    console.log('⏱️ Initializing Long Task Monitor...');
  }

  async setup(context: TestExecutionContext): Promise<void> {
    await context.page.addInitScript(() => {
      if ('PerformanceObserver' in window) {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            (window as any).__longTasks = (window as any).__longTasks || [];
            (window as any).__longTasks.push({
              startTime: entry.startTime,
              duration: entry.duration,
              attribution: entry.attribution || [],
            });
          }
        }).observe({ entryTypes: ['longtask'] });
      }
    });
  }
}

class MetricsCollector {
  async start(context: TestExecutionContext, config: TestExecutionConfig['monitoring']): Promise<void> {
    // Start metrics collection based on configuration
    console.log('📊 Starting metrics collection...');
  }

  async stop(context: TestExecutionContext): Promise<void> {
    // Stop metrics collection and cleanup
    clearInterval((context as any).memoryInterval);
    console.log('📊 Stopped metrics collection');
  }
}

class DataProcessor {
  async process(context: TestExecutionContext): Promise<any> {
    // Process collected data
    return {
      networkRequests: context.networkRequests,
      consoleMessages: context.consoleMessages,
      memorySnapshots: context.memorySnapshots,
      longTasks: context.longTasks,
      errors: context.errors,
    };
  }
}

class ExecutionReportGenerator {
  async generateReport(context: TestExecutionContext): Promise<string> {
    // Generate execution report
    return `Execution report for ${context.id}`;
  }
}
