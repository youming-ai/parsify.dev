/**
 * Test fixtures for tools homepage E2E tests
 * Contains realistic test data for various scenarios
 */

export const TOOL_CATEGORIES = [
  'JSON Processing',
  'Code Execution',
  'File Processing',
  'Network Utilities',
  'Text Processing',
  'Security & Encryption'
] as const;

export const TOOL_TAGS = [
  'json', 'formatter', 'validator', 'converter', 'parser',
  'code', 'executor', 'minifier', 'obfuscator', 'comparator',
  'file', 'converter', 'csv', 'text', 'processor',
  'hash', 'password', 'encryptor', 'uuid', 'security',
  'http', 'client', 'ip', 'lookup', 'meta', 'tags',
  'base64', 'url', 'encoder', 'decoder', 'regex'
] as const;

export const SAMPLE_TOOLS = [
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    category: 'JSON Processing',
    tags: ['json', 'formatter', 'validator'],
    difficulty: 'beginner',
    isPopular: true,
    href: '/tools/json/formatter'
  },
  {
    id: 'code-executor',
    name: 'Code Executor',
    category: 'Code Execution',
    tags: ['code', 'executor', 'sandbox'],
    difficulty: 'intermediate',
    isPopular: true,
    href: '/tools/code/executor'
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    category: 'Security & Encryption',
    tags: ['hash', 'security', 'checksum'],
    difficulty: 'beginner',
    isPopular: true,
    href: '/tools/security/hash-generator'
  },
  {
    id: 'file-converter',
    name: 'File Converter',
    category: 'File Processing',
    tags: ['file', 'converter', 'batch'],
    difficulty: 'beginner',
    isNew: true,
    href: '/tools/file/converter'
  }
] as const;

export const SEARCH_QUERIES = {
  valid: [
    'json',
    'formatter',
    'hash',
    'converter',
    'validator',
    'minifier'
  ],
  invalid: [
    'xyznonexistenttool123',
    'notarealtool',
    'qwertyuiopasdfghjkl',
    'toolthatdoesnotexist123456'
  ],
  edge_cases: [
    '', // empty search
    ' ', // space only
    'a', // single character
    'very long search query that should still work but might return limited results',
    'json-formatter', // specific tool name
    'JSON', // case sensitive test
    'Json', // mixed case
    'json formatter' // multiple words
  ]
} as const;

export const VIEWPORTS = {
  mobile: {
    width: 375,
    height: 667,
    name: 'Mobile (iPhone SE)'
  },
  mobile_large: {
    width: 414,
    height: 896,
    name: 'Mobile (iPhone 11)'
  },
  tablet: {
    width: 768,
    height: 1024,
    name: 'Tablet (iPad)'
  },
  desktop: {
    width: 1920,
    height: 1080,
    name: 'Desktop (Full HD)'
  },
  desktop_large: {
    width: 2560,
    height: 1440,
    name: 'Desktop (2K)'
  }
} as const;

export const USER_SCENARIOS = {
  // Developer looking for JSON tools
  json_developer: {
    search_query: 'json',
    expected_categories: ['JSON Processing'],
    expected_tools: ['json-formatter', 'json-validator', 'json-converter'],
    workflow: ['search', 'filter_by_category', 'select_tool']
  },

  // Security conscious user
  security_user: {
    search_query: 'hash',
    expected_categories: ['Security & Encryption'],
    expected_tools: ['hash-generator', 'password-generator'],
    workflow: ['search', 'check_security_features', 'select_tool']
  },

  // File processing needs
  file_user: {
    search_query: 'converter',
    expected_categories: ['File Processing'],
    expected_tools: ['file-converter', 'csv-processor'],
    workflow: ['search', 'filter_by_features', 'select_tool']
  },

  // Code optimization
  code_optimizer: {
    search_query: 'minifier',
    expected_categories: ['Code Execution'],
    expected_tools: ['code-minifier', 'json-minifier'],
    workflow: ['search', 'check_performance', 'select_tool']
  }
} as const;

export const PERFORMANCE_THRESHOLDS = {
  page_load: {
    target: 3000, // 3 seconds
    acceptable: 5000 // 5 seconds
  },
  search_response: {
    target: 300, // 300ms for debounced search
    acceptable: 500 // 500ms
  },
  filter_response: {
    target: 200, // 200ms for filter changes
    acceptable: 400 // 400ms
  },
  tool_navigation: {
    target: 1000, // 1 second to navigate to tool
    acceptable: 2000 // 2 seconds
  }
} as const;

export const ACCESSIBILITY_TEST_CASES = [
  {
    name: 'Keyboard Navigation',
    description: 'All interactive elements should be keyboard accessible',
    test: async (page: any) => {
      // Test Tab navigation
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      return ['INPUT', 'BUTTON', 'A', 'SELECT'].includes(focused || '');
    }
  },
  {
    name: 'Screen Reader Support',
    description: 'ARIA labels and roles should be properly set',
    test: async (page: any) => {
      const tabs = page.locator('[role="tab"]');
      const count = await tabs.count();
      for (let i = 0; i < count; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toHaveAttribute('role', 'tab');
        await expect(tab).toHaveAttribute('aria-selected');
      }
      return true;
    }
  },
  {
    name: 'Color Contrast',
    description: 'Text should have sufficient contrast ratios',
    test: async (page: any) => {
      const headings = page.locator('h1, h2, h3');
      const firstHeading = headings.first();
      await expect(firstHeading).toBeVisible();
      return true;
    }
  }
] as const;

export const ERROR_SCENARIOS = [
  {
    name: 'Network Error',
    description: 'Should handle network connectivity issues',
    setup: async (page: any) => {
      await page.route('**/*', route => route.abort());
    }
  },
  {
    name: 'Storage Quota Exceeded',
    description: 'Should handle localStorage quota exceeded',
    setup: async (page: any) => {
      await page.addInitScript(() => {
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function () {
          throw new Error('Storage quota exceeded');
        };
      });
    }
  },
  {
    name: 'Large Dataset',
    description: 'Should handle large number of tools without performance degradation',
    setup: async (page: any) => {
      // Could be used to inject test data
      await page.addInitScript(() => {
        // Simulate large dataset
        window.TEST_LARGE_DATASET = true;
      });
    }
  }
] as const;

export const NETWORK_CONDITIONS = {
  offline: {
    offline: true,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0
  },
  slow_3g: {
    offline: false,
    downloadThroughput: 500 * 1024 / 8, // 500 Kbps
    uploadThroughput: 500 * 1024 / 8, // 500 Kbps
    latency: 400 * 5 // 400ms latency with 5x CPU slowdown
  },
  fast_3g: {
    offline: false,
    downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
    uploadThroughput: 750 * 1024 / 8, // 750 Kbps
    latency: 150 * 3 // 150ms latency with 3x CPU slowdown
  }
} as const;

export type ToolCategory = typeof TOOL_CATEGORIES[number];
export type ToolTag = typeof TOOL_TAGS[number];
export type ViewportType = keyof typeof VIEWPORTS;
export type UserScenario = keyof typeof USER_SCENARIOS;
export type NetworkCondition = keyof typeof NETWORK_CONDITIONS;
