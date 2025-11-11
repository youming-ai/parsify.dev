/**
 * Global setup for cross-browser E2E testing
 * Prepares test environment and handles cross-browser configurations
 */

import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up cross-browser E2E test environment...');

  // Create test results directories
  const testResultsDir = path.join(process.cwd(), 'test-results');
  const screenshotsDir = path.join(testResultsDir, 'screenshots');
  const videosDir = path.join(testResultsDir, 'videos');
  const tracesDir = path.join(testResultsDir, 'traces');

  [testResultsDir, screenshotsDir, videosDir, tracesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Setup test data and fixtures
  await setupTestData();

  // Setup browser-specific configurations
  await setupBrowserConfigs();

  // Verify test server accessibility
  await verifyTestServer();

  // Setup performance monitoring
  await setupPerformanceMonitoring();

  console.log('✅ Cross-browser E2E test environment ready');
}

async function setupTestData() {
  console.log('📋 Setting up test data...');

  // Create test data files if they don't exist
  const testDataDir = path.join(process.cwd(), 'tests', 'e2e', 'data');

  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }

  // Test JSON data
  const testJsonData = {
    valid: {
      name: "Test User",
      age: 30,
      active: true,
      tags: ["developer", "testing"]
    },
    invalid: '{"name": "Test", "age": }',
    large: JSON.stringify({
      data: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random()
      }))
    })
  };

  fs.writeFileSync(
    path.join(testDataDir, 'test-data.json'),
    JSON.stringify(testJsonData, null, 2)
  );

  // Test text data
  const testTextData = {
    short: 'Test text',
    long: 'This is a longer test text that can be used for testing text processing functions including formatting, encoding, and other text-related operations.',
    unicode: 'Test with unicode: ñáéíóú 🚀 test',
    special: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
    multiline: `Line 1\nLine 2\nLine 3`
  };

  fs.writeFileSync(
    path.join(testDataDir, 'test-text.json'),
    JSON.stringify(testTextData, null, 2)
  );
}

async function setupBrowserConfigs() {
  console.log('🌐 Setting up browser configurations...');

  // Create browser-specific user preferences
  const browserPrefs = {
    chrome: {
      'profile.default_content_setting_values.notifications': 2,
      'profile.default_content_settings.popups': 0,
      'download.prompt_for_download': false,
      'profile.default_content_setting_values.automatic_downloads': 1
    },
    firefox: {
      'browser.download.folderList': 2,
      'browser.download.dir': path.join(process.cwd(), 'test-results', 'downloads'),
      'browser.download.useDownloadDir': true,
      'browser.helperApps.neverAsk.saveToDisk': 'application/json,text/plain,application/octet-stream'
    }
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'test-results', 'browser-prefs.json'),
    JSON.stringify(browserPrefs, null, 2)
  );
}

async function verifyTestServer() {
  console.log('🔍 Verifying test server accessibility...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const response = await page.goto('http://localhost:3001/tools', {
      timeout: 30000
    });

    if (!response || response.status() >= 400) {
      throw new Error(`Test server not responding: ${response?.status()}`);
    }

    console.log('✅ Test server is accessible');
  } catch (error) {
    console.error('❌ Test server verification failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

async function setupPerformanceMonitoring() {
  console.log('📊 Setting up performance monitoring...');

  // Create performance monitoring configuration
  const perfConfig = {
    thresholds: {
      loadTime: 5000,
      firstContentfulPaint: 2000,
      largestContentfulPaint: 3000,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 100
    },
    networkConditions: {
      slow3g: {
        downloadThroughput: 500 * 1024 / 8,
        uploadThroughput: 500 * 1024 / 8,
        latency: 400 * 5
      },
      fast3g: {
        downloadThroughput: 1.6 * 1024 * 1024 / 8,
        uploadThroughput: 750 * 1024 / 8,
        latency: 150 * 3
      }
    }
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'test-results', 'performance-config.json'),
    JSON.stringify(perfConfig, null, 2)
  );
}

export default globalSetup;
