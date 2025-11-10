import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { Processor, processHTTPRequest, processIPLookup, generateMetaTags } from '@/lib/processing';

// Mock fetch for network requests
global.fetch = vi.fn();

describe('Network Processing Utilities', () => {
  const testURL = 'https://api.example.com/test';
  const testIP = '8.8.8.8';
  const testMetadata = {
    title: 'Test Page',
    description: 'This is a test page for meta tag generation',
    keywords: 'test, meta, tags, generation',
    author: 'Test Author',
    canonical: 'https://example.com/test',
    ogImage: 'https://example.com/image.jpg',
    twitterCard: 'summary_large_image',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processHTTPRequest', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([
          ['content-type', 'application/json'],
          ['x-request-id', '12345'],
        ]),
        url: testURL,
        json: vi.fn().mockResolvedValue({ success: true, data: 'test' }),
        text: vi.fn().mockResolvedValue('test response'),
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const result = await Processor.processHTTPRequest(testURL);

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ success: true, data: 'test' });
      expect(result.metadata).toBeDefined();
      expect(result.metadata.status).toBe(200);
      expect(result.metadata.statusText).toBe('OK');
      expect(result.metadata.contentType).toBe('application/json');
      expect(result.metadata.url).toBe(testURL);
      expect(result.metadata.headers['content-type']).toBe('application/json');
      expect(result.metadata.headers['x-request-id']).toBe('12345');

      expect(fetch).toHaveBeenCalledWith(testURL, {
        method: 'GET',
        headers: {},
        signal: expect.any(AbortSignal),
      });
    });

    it('should make POST request with body', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Map([['content-type', 'application/json']]),
        url: testURL,
        json: vi.fn().mockResolvedValue({ id: 1, created: true }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const requestBody = { name: 'Test', value: 123 };
      const result = await Processor.processHTTPRequest(testURL, {
        method: 'POST',
        body: requestBody,
        headers: { 'Content-Type': 'application/json' },
      });

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ id: 1, created: true });

      expect(fetch).toHaveBeenCalledWith(testURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: expect.any(AbortSignal),
      });
    });

    it('should handle text response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'text/plain']]),
        url: testURL,
        text: vi.fn().mockResolvedValue('Plain text response'),
        json: vi.fn().mockResolvedValue({}),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const result = await Processor.processHTTPRequest(testURL);

      expect(result.success).toBe(true);
      expect(result.result).toBe('Plain text response');
      expect(result.metadata.contentType).toBe('text/plain');
    });

    it('should handle binary response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/octet-stream']]),
        url: testURL,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(20)),
        text: vi.fn().mockResolvedValue(''),
        json: vi.fn().mockResolvedValue({}),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const result = await Processor.processHTTPRequest(testURL);

      expect(result.success).toBe(true);
      expect(result.result).toBeInstanceOf(ArrayBuffer);
      expect(result.metadata.contentType).toBe('application/octet-stream');
    });

    it('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map(),
        url: testURL,
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const result = await Processor.processHTTPRequest(testURL);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('HTTP_REQUEST_ERROR');
      expect(result.error?.message).toContain('HTTP 404: Not Found');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      vi.mocked(fetch).mockRejectedValue(networkError);

      const result = await Processor.processHTTPRequest(testURL);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('HTTP_REQUEST_ERROR');
      expect(result.error?.message).toBe('Network error');
    });

    it('should respect timeout', async () => {
      vi.useFakeTimers();

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        url: testURL,
        json: vi.fn().mockResolvedValue({}),
      };

      // Mock a delayed response
      vi.mocked(fetch).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(mockResponse), 15000); // 15 seconds
        });
      });

      const result = await Processor.processHTTPRequest(testURL, { timeout: 1000 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('HTTP_REQUEST_ERROR');

      vi.useRealTimers();
    });

    it('should provide processing metrics', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        url: testURL,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const result = await Processor.processHTTPRequest(testURL, {
        method: 'POST',
        body: { test: 'data' },
      });

      expect(result.success).toBe(true);
      expect(result.metrics.duration).toBeGreaterThan(0);
      expect(result.metrics.inputSize).toBeGreaterThan(0);
      expect(result.metrics.outputSize).toBeGreaterThan(0);
    });

    it('should support different HTTP methods', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        url: testURL,
        json: vi.fn().mockResolvedValue({}),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

      for (const method of methods) {
        const result = await Processor.processHTTPRequest(testURL, { method });
        expect(result.success).toBe(true);
        expect(fetch).toHaveBeenCalledWith(testURL, expect.objectContaining({ method }));
      }
    });
  });

  describe('processIPLookup', () => {
    const mockIPAPIResponse = {
      ip: '8.8.8.8',
      network: 'Google LLC',
      version: 'IPv4',
      city: 'Mountain View',
      region: 'California',
      region_code: 'CA',
      country: 'United States',
      country_name: 'United States',
      country_code: 'US',
      latitude: 37.422,
      longitude: -122.084,
      postal: '94043',
      timezone: 'America/Los_Angeles',
      org: 'Google LLC',
      asn: 'AS15169 Google LLC',
    };

    const mockIPAPIResponseAlt = {
      ip: '8.8.8.8',
      country: 'United States',
      countryCode: 'US',
      region: 'CA',
      regionName: 'California',
      city: 'Mountain View',
      zip: '94043',
      lat: 37.422,
      lon: -122.084,
      timezone: 'America/Los_Angeles',
      isp: 'Google LLC',
      org: 'Google LLC',
      as: 'AS15169 Google LLC',
      query: '8.8.8.8',
    };

    it('should lookup IP with ipapi provider', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockIPAPIResponse),
      });

      const result = await Processor.processIPLookup(testIP);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result.ip).toBe('8.8.8.8');
      expect(result.result.country).toBe('United States');
      expect(result.result.city).toBe('Mountain View');
      expect(result.result.region).toBe('California');
      expect(result.result.latitude).toBe(37.422);
      expect(result.result.longitude).toBe(-122.084);
      expect(result.result.isp).toBe('Google LLC');

      expect(result.metadata.provider).toBe('ipapi');
      expect(result.metadata.query).toBe(testIP);
      expect(result.metadata.timestamp).toBeDefined();

      expect(fetch).toHaveBeenCalledWith('https://ipapi.co/8.8.8.8/json/', {
        method: 'GET',
        signal: expect.any(AbortSignal),
      });
    });

    it('should lookup IP with ip-api provider', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockIPAPIResponseAlt),
      });

      const result = await Processor.processIPLookup(testIP, {
        provider: 'ip-api',
      });

      expect(result.success).toBe(true);
      expect(result.result.ip).toBe('8.8.8.8');
      expect(result.result.country).toBe('United States');
      expect(result.result.regionName).toBe('California');
      expect(result.result.lat).toBe(37.422);
      expect(result.result.lon).toBe(-122.084);

      expect(result.metadata.provider).toBe('ip-api');
    });

    it('should lookup IP with ipgeolocation provider', async () => {
      const mockGeoResponse = {
        ip: '8.8.8.8',
        country_code: 'US',
        country_name: 'United States',
        region_code: 'CA',
        region_name: 'California',
        city: 'Mountain View',
        latitude: 37.422,
        longitude: -122.084,
        timezone: 'America/Los_Angeles',
        isp: 'Google LLC',
        organization: 'Google LLC',
        as: 'AS15169',
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockGeoResponse),
      });

      const result = await Processor.processIPLookup(testIP, {
        provider: 'ipgeolocation',
      });

      expect(result.success).toBe(true);
      expect(result.result.ip).toBe('8.8.8.8');
      expect(result.result.countryCode).toBe('US');
      expect(result.result.latitude).toBe(37.422);

      expect(result.metadata.provider).toBe('ipgeolocation');
    });

    it('should handle invalid IP format', async () => {
      const invalidIP = 'invalid.ip.address';

      vi.mocked(fetch).mockRejectedValue(new Error('Invalid IP address'));

      const result = await Processor.processIPLookup(invalidIP);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('IP_LOOKUP_ERROR');
      expect(result.error?.message).toContain('IP lookup failed');
    });

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const result = await Processor.processIPLookup(testIP);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('IP_LOOKUP_ERROR');
    });

    it('should handle unsupported provider', async () => {
      const result = await Processor.processIPLookup(testIP, {
        provider: 'unsupported',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('IP_LOOKUP_ERROR');
      expect(result.error?.message).toContain('Unsupported IP lookup provider');
    });

    it('should standardize response format across providers', async () => {
      // Test with ipapi (has different field names)
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          ip: '8.8.8.8',
          country_name: 'United States',
          region: 'California',
          lat: 37.422,
          lon: -122.084,
        }),
      });

      const result = await Processor.processIPLookup(testIP, { provider: 'ipapi' });

      expect(result.success).toBe(true);
      expect(result.result.ip).toBe('8.8.8.8');
      expect(result.result.country).toBe('United States');
      expect(result.result.region).toBe('California');
      expect(result.result.latitude).toBe(37.422);
      expect(result.result.longitude).toBe(-122.084);
    });

    it('should provide processing metrics', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockIPAPIResponse),
      });

      const result = await Processor.processIPLookup(testIP);

      expect(result.success).toBe(true);
      expect(result.metrics.duration).toBeGreaterThan(0);
      expect(result.metrics.inputSize).toBe(testIP.length);
      expect(result.metrics.outputSize).toBeGreaterThan(0);
    });

    it('should handle IPv6 addresses', async () => {
      const ipv6IP = '2001:4860:4860::8888';
      const mockIPv6Response = {
        ip: '2001:4860:4860::8888',
        country: 'United States',
        country_code: 'US',
        // ... other fields
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockIPv6Response),
      });

      const result = await Processor.processIPLookup(ipv6IP);

      expect(result.success).toBe(true);
      expect(result.result.ip).toBe(ipv6IP);
      expect(result.metrics.inputSize).toBe(ipv6IP.length);
    });
  });

  describe('generateMetaTags', () => {
    it('should generate basic meta tags', async () => {
      const metadata = {
        title: 'Test Page',
        description: 'This is a test page',
        keywords: 'test, page',
        author: 'Test Author',
        charset: 'utf-8',
        viewport: 'width=device-width, initial-scale=1',
      };

      const result = await Processor.generateMetaTags(metadata);

      expect(result.success).toBe(true);
      expect(result.result).toContain('<meta charset="utf-8">');
      expect(result.result).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
      expect(result.result).toContain('<title>Test Page</title>');
      expect(result.result).toContain('<meta name="description" content="This is a test page">');
      expect(result.result).toContain('<meta name="keywords" content="test, page">');
      expect(result.result).toContain('<meta name="author" content="Test Author">');
    });

    it('should generate Open Graph tags', async () => {
      const metadata = {
        title: 'Test Page',
        description: 'This is a test page',
        ogType: 'article',
        ogSiteName: 'Test Site',
        ogImage: 'https://example.com/image.jpg',
      };

      const result = await Processor.generateMetaTags(metadata);

      expect(result.success).toBe(true);
      expect(result.result).toContain('<meta property="og:title" content="Test Page">');
      expect(result.result).toContain('<meta property="og:description" content="This is a test page">');
      expect(result.result).toContain('<meta property="og:type" content="article">');
      expect(result.result).toContain('<meta property="og:site_name" content="Test Site">');
      expect(result.result).toContain('<meta property="og:image" content="https://example.com/image.jpg">');
    });

    it('should generate Twitter Card tags', async () => {
      const metadata = {
        title: 'Test Page',
        description: 'This is a test page',
        twitterCard: 'summary_large_image',
        twitterTitle: 'Test Twitter Title',
        twitterDescription: 'Test Twitter Description',
        twitterImage: 'https://example.com/twitter.jpg',
        twitterSite: '@example',
      };

      const result = await Processor.generateMetaTags(metadata);

      expect(result.success).toBe(true);
      expect(result.result).toContain('<meta name="twitter:card" content="summary_large_image">');
      expect(result.result).toContain('<meta name="twitter:title" content="Test Twitter Title">');
      expect(result.result).toContain('<meta name="twitter:description" content="Test Twitter Description">');
      expect(result.result).toContain('<meta name="twitter:image" content="https://example.com/twitter.jpg">');
      expect(result.result).toContain('<meta name="twitter:site" content="@example">');
    });

    it('should generate canonical URL', async () => {
      const metadata = {
        canonical: 'https://example.com/canonical-url',
      };

      const result = await Processor.generateMetaTags(metadata);

      expect(result.success).toBe(true);
      expect(result.result).toContain('<link rel="canonical" href="https://example.com/canonical-url">');
    });

    it('should handle robots meta tag', async () => {
      const metadata = {
        robots: 'index,follow',
      };

      const result = await Processor.generateMetaTags(metadata);

      expect(result.success).toBe(true);
      expect(result.result).toContain('<meta name="robots" content="index,follow">');
    });

    it('should handle custom meta tags', async () => {
      const metadata = {
        'custom-meta': 'custom value',
        'og:custom': 'og custom value',
        'twitter:custom': 'twitter custom value',
        'standard-name': 'standard value',
      };

      const result = await Processor.generateMetaTags(metadata);

      expect(result.success).toBe(true);
      expect(result.result).toContain('<meta name="custom-meta" content="custom value">');
      expect(result.result).toContain('<meta property="og:custom" content="og custom value">');
      expect(result.result).toContain('<meta name="twitter:custom" content="twitter custom value">');
      expect(result.result).toContain('<meta name="standard-name" content="standard value">');
    });

    it('should prioritize options over metadata', async () => {
      const metadata = {
        title: 'Metadata Title',
        description: 'Metadata Description',
        ogTitle: 'Options OG Title',
        ogDescription: 'Options OG Description',
      };

      const options = {
        title: 'Options Title',
        ogTitle: 'Override OG Title',
        ogDescription: 'Override OG Description',
      };

      const result = await Processor.generateMetaTags(metadata, options);

      expect(result.success).toBe(true);
      expect(result.result).toContain('<title>Options Title</title>');
      expect(result.result).toContain('<meta property="og:title" content="Override OG Title">');
      expect(result.result).toContain('<meta property="og:description" content="Override OG Description">');
      expect(result.result).toContain('<meta name="description" content="Metadata Description">');
    });

    it('should include fallbacks for social sharing', async () => {
      const metadata = {
        title: 'Test Page',
        description: 'Test description',
        ogImage: 'https://example.com/og-image.jpg',
        twitterCard: 'summary_large_image',
      };

      const result = await Processor.generateMetaTags(metadata);

      expect(result.success).toBe(true);
      // Twitter should use OG image as fallback
      expect(result.result).toContain('<meta name="twitter:image" content="https://example.com/og-image.jpg">');
    });

    it('should handle empty metadata', async () => {
      const metadata = {};

      const result = await Processor.generateMetaTags(metadata);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.metadata.title).toBeUndefined();
      expect(result.metadata.description).toBeUndefined();
    });

    it('should provide processing metadata', async () => {
      const result = await Processor.generateMetaTags(testMetadata);

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.title).toBe('Test Page');
      expect(result.metadata.description).toBe('This is a test page for meta tag generation');
      expect(result.metadata.keywords).toBe('test, meta, tags, generation');
      expect(result.metadata.tagCount).toBeGreaterThan(0);
      expect(result.metadata.includesOpenGraph).toBe(true);
      expect(result.metadata.includesTwitterCard).toBe(true);
    });

    it('should calculate tag count correctly', async () => {
      const metadata = {
        title: 'Test',
        description: 'Test description',
        keywords: 'test',
        author: 'Author',
        ogImage: 'https://example.com/image.jpg',
        twitterCard: 'summary',
      };

      const result = await Processor.generateMetaTags(metadata);

      expect(result.success).toBe(true);
      expect(result.metadata.tagCount).toBeGreaterThan(5);
    });

    it('should handle special characters in values', async () => {
      const metadata = {
        title: 'Test & Special <Characters>',
        description: 'Test with "quotes" and \\backslashes\\',
        keywords: 'test, special, characters, &, <, >, "',
      };

      const result = await Processor.generateMetaTags(metadata);

      expect(result.success).toBe(true);
      expect(result.result).toContain('Test &amp; Special &lt;Characters&gt;');
    });

    it('should provide processing metrics', async () => {
      const result = await Processor.generateMetaTags(testMetadata);

      expect(result.success).toBe(true);
      expect(result.metrics.duration).toBeGreaterThan(0);
      expect(result.metrics.inputSize).toBeGreaterThan(0);
      expect(result.metrics.outputSize).toBeGreaterThan(0);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle null inputs gracefully', async () => {
      const result = await Processor.processHTTPRequest(null as any);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle undefined inputs gracefully', async () => {
      const result = await Processor.processIPLookup(undefined as any);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty metadata for meta tag generation', async () => {
      const result = await Processor.generateMetaTags({});

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result).toBe(''); // Should return empty string
    });

    it('should handle concurrent requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        url: testURL,
        json: vi.fn().mockResolvedValue({ success: true }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const promises = [
        Processor.processHTTPRequest(testURL),
        Processor.processHTTPRequest(testURL + '/2'),
        Processor.processHTTPRequest(testURL + '/3'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Convenience functions', () => {
    it('should work as convenience functions', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        url: testURL,
        json: vi.fn().mockResolvedValue({ test: 'data' }),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ ip: testIP, country: 'US' }),
      });

      const httpResult = await processHTTPRequest(testURL);
      const ipResult = await processIPLookup(testIP);
      const metaResult = await generateMetaTags(testMetadata);

      expect(httpResult.success).toBe(true);
      expect(ipResult.success).toBe(true);
      expect(metaResult.success).toBe(true);

      expect(httpResult.result).toEqual({ test: 'data' });
      expect(ipResult.result.ip).toBe(testIP);
      expect(metaResult.result).toContain('<title>Test Page</title>');
    });
  });
});
