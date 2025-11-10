import '@testing-library/jest-dom';

// Mock Web Crypto API for tests
if (!global.crypto) {
  global.crypto = {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {} as SubtleCrypto,
  };
}

// Mock window object for tests that need it
if (typeof window === 'undefined') {
  (global as any).window = {
    crypto: global.crypto,
    TextEncoder: global.TextEncoder,
    TextDecoder: global.TextDecoder,
    btoa: (str: string) => Buffer.from(str, 'binary').toString('base64'),
    atob: (str: string) => Buffer.from(str, 'base64').toString('binary'),
  };
}

// Mock DOMParser for XML parsing
if (!global.DOMParser) {
  global.DOMParser = class DOMParser {
    parseFromString() {
      return {
        documentElement: {},
      };
    }
  };
} as any;
