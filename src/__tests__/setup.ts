import '@testing-library/jest-dom/vitest';

import { afterEach, vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(global, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(global, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Mock DOMPurify for happy-dom
global.DOMPurify = {
  sanitize: (html: string, config?: Record<string, unknown>) => {
    // Basic sanitization for tests
    if (!html) return '';

    // Remove script tags and their content
    let sanitized = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '');

    // Remove dangerous event handlers
    const dangerousAttrs = ['onclick', 'onerror', 'onload', 'onmouseover'];
    dangerousAttrs.forEach((attr) => {
      const attrPattern = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
      sanitized = sanitized.replace(attrPattern, '');
    });

    // Remove dangerous protocols
    sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
    sanitized = sanitized.replace(/href\s*=\s*["']data:[^"']*["']/gi, '');

    // If config specifies allowed tags, filter them
    if (config?.ALLOWED_TAGS) {
      const allowedTags = config.ALLOWED_TAGS as string[];
      const tagRegex = /<(\w+)[^>]*>/g;
      sanitized = sanitized.replace(tagRegex, (match, tag) => {
        const tagName = tag.toLowerCase();
        if (allowedTags.includes(tagName)) {
          // Filter attributes based on ALLOWED_ATTR
          if (config.ALLOWED_ATTR) {
            const allowedAttrs = config.ALLOWED_ATTR as string[];
            const attrRegex = /(\w+)=["'][^"']*["']/g;
            let filtered = match;
            filtered = filtered.replace(attrRegex, (attrMatch, attrName) => {
              if (allowedAttrs.includes(attrName.toLowerCase())) {
                return attrMatch;
              }
              return '';
            });
            return filtered;
          }
          return match;
        }
        return '';
      });
    }

    // Remove data attributes if ALLOW_DATA_ATTR is false
    if (config?.ALLOW_DATA_ATTR === false) {
      sanitized = sanitized.replace(/\sdata-[^=]*="[^"]*"/gi, '');
    }

    return sanitized;
  },
};
