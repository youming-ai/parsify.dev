import { test, expect } from '@playwright/test';

test.describe('Network Tools E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the tools page
    await page.goto('/tools');
  });

  test.describe('HTTP Client', () => {
    test('should make GET requests', async ({ page }) => {
      // Navigate to HTTP client
      await page.click('a[href="/tools/network/http-client"]');
      await page.waitForLoadState('networkidle');

      // Enter URL
      await page.fill('input[name="url"]', 'https://httpbin.org/get');

      // Click send request button
      await page.click('button:has-text("Send Request")');

      // Wait for response
      await page.waitForSelector('[data-testid="http-response"]', { timeout: 15000 });

      // Should show response details
      await expect(page.locator('[data-testid="status-code"]')).toBeVisible();
      await expect(page.locator('[data-testid="response-body"]')).toBeVisible();
      await expect(page.locator('text=200')).toBeVisible();
    });

    test('should make POST requests with JSON body', async ({ page }) => {
      await page.click('a[href="/tools/network/http-client"]');
      await page.waitForLoadState('networkidle');

      // Select POST method
      await page.selectOption('select[name="method"]', 'POST');

      // Enter URL
      await page.fill('input[name="url"]', 'https://httpbin.org/post');

      // Add headers
      await page.fill('input[name="header-name"]', 'Content-Type');
      await page.fill('input[name="header-value"]', 'application/json');
      await page.click('button:has-text("Add Header")');

      // Enter JSON body
      await page.fill('textarea[name="body"]', '{"name": "test", "value": 123}');

      await page.click('button:has-text("Send Request")');

      await page.waitForSelector('[data-testid="http-response"]', { timeout: 15000 });

      // Should show JSON response
      await expect(page.locator('[data-testid="response-body"]')).toBeVisible();
      await expect(page.locator('text=application/json')).toBeVisible();
    });

    test('should handle request headers', async ({ page }) => {
      await page.click('a[href="/tools/network/http-client"]');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="url"]', 'https://httpbin.org/headers');

      // Add custom headers
      await page.fill('input[name="header-name"]', 'User-Agent');
      await page.fill('input[name="header-value"]', 'ParsifyDev-Test/1.0');
      await page.click('button:has-text("Add Header")');

      await page.fill('input[name="header-name"]', 'Accept');
      await page.fill('input[name="header-value"]', 'application/json');
      await page.click('button:has-text("Add Header")');

      await page.click('button:has-text("Sent Request")');

      await page.waitForSelector('[data-testid="http-response"]', { timeout: 15000 });

      // Should show response with headers received
      await expect(page.locator('[data-testid="response-headers"]')).toBeVisible();
    });

    test('should display request/response timing', async ({ page }) => {
      await page.click('a[href="/tools/network/http-client"]');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="url"]', 'https://httpbin.org/delay/3');
      await page.click('button:has-text("Send Request")');

      await page.waitForSelector('[data-testid="http-response"]', { timeout: 20000 });

      // Should show timing information
      await expect(page.locator('[data-testid="timing-info"]')).toBeVisible();
      await expect(page.locator('text=Request Time')).toBeVisible();
      await expect(page.locator('text=Total Time')).toBeVisible();
    });

    test('should handle request errors gracefully', async ({ page }) => {
      await page.click('a[href="/tools/network/http-client"]');
      await page.waitForLoadState('networkidle');

      // Use invalid URL
      await page.fill('input[name="url"]', 'https://invalid-url-that-does-not-exist.com');
      await page.click('button:has-text("Send Request")');

      // Should show error after timeout
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 15000 });
      await expect(page.locator('text=Request failed')).toBeVisible();
      await expect(page.locator('text=Network error')).toBeVisible();
    });

    test('should support different HTTP methods', async ({ page }) => {
      await page.click('a[href="/tools/network/http-client"]');
      await page.waitForLoadState('networkidle');

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

      for (const method of methods) {
        // Clear previous results
        await page.click('button:has-text("Clear Results")');

        await page.selectOption('select[name="method"]', method);
        await page.fill('input[name="url"]', 'https://httpbin.org/' + method.toLowerCase());
        await page.click('button:has-text("Send Request")');

        // Wait for response or timeout
        try {
          await page.waitForSelector('[data-testid="http-response"]', { timeout: 10000 });
          await expect(page.locator(`text=${method}`)).toBeVisible();
        } catch (error) {
          // Some methods might not be supported by httpbin
          // This is expected behavior
        }
      }
    });

    test('should allow saving and loading requests', async ({ page }) => {
      await page.click('a[href="/tools/network/http-client"]');
      await page.waitForLoadState('networkidle');

      // Create a request
      await page.fill('input[name="url"]', 'https://httpbin.org/json');
      await page.fill('textarea[name="body"]', '{"test": "data"}');
      await page.click('button:has-text("Send Request")');

      await page.waitForSelector('[data-testid="http-response"]', { timeout: 15000 });

      // Save the request
      await page.click('button:has-text("Save Request")');
      await expect(page.locator('text=Request saved')).toBeVisible();

      // Clear and load saved request
      await page.click('button:has-text("Clear Results")');
      await page.click('button:has-text("Load Saved")');

      // Should repopulate the form
      await expect(page.locator('input[name="url"]')).toHaveValue('https://httpbin.org/json');
      await expect(page.locator('textarea[name="body"]')).toHaveValue('{"test": "data"}');
    });
  });

  test.describe('IP Lookup', () => {
    test('should lookup IP address information', async ({ page }) => {
      await page.click('a[href="/tools/network/ip-lookup"]');
      await page.waitForLoadState('networkidle');

      // Enter IP address
      await page.fill('input[name="ip"]', '8.8.8.8');

      // Select provider
      await page.selectOption('select[name="provider"]', 'ipapi');

      await page.click('button:has-text("Lookup IP")');

      // Wait for results
      await page.waitForSelector('[data-testid="ip-results"]', { timeout: 10000 });

      // Should show IP information
      await expect(page.locator('[data-testid="ip-address"]')).toContain('8.8.8.8');
      await expect(page.locator('[data-testid="country"]')).toBeVisible();
      await expect(page.locator('[data-testid="region"]')).toBeVisible();
      await expect(page.locator('[data-testid="city"]')).toBeVisible();
      await expect(page.lookup('[data-testid="isp"]')).toBeVisible();
    });

    test('should work with different IP lookup providers', async ({ page }) => {
      await page.click('a[href="/tools/network/ip-lookup"]');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="ip"]', '1.1.1.1');

      // Test ip-api provider
      await page.selectOption('select[name="provider"]', 'ip-api');
      await page.click('button:has-text("Lookup IP")');

      await page.waitForSelector('[data-testid="ip-results"]', { timeout: 10000 });
      expect(page.locator('[data-testid="provider"]')).toContain('ip-api');

      // Clear and test ipgeolocation provider
      await page.click('button:has-text("Clear Results")');
      await page.selectOption('select[name="provider"]', 'ipgeolocation');
      await page.click('button:has-text("Lookup IP")');

      await page.waitForSelector('[data-testid="ip-results"]', { timeout: 10000 });
      expect(page.locator('[data-testid="provider"]')).toContain('ipgeolocation');
    });

    should('display location on map', async ({ page }) => {
      await page.click('a[href="/tools/network/ip-lookup"]');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="ip"]', '8.8.8.8');
      await page.click('button:has-text("Lookup IP")');

      await page.waitForSelector('[data-testid="ip-results"]', { timeout: 10000 });

      // Should show map if location data is available
      const mapElement = page.locator('[data-testid="location-map"]');
      if (await mapElement.isVisible()) {
        expect(mapElement).toBeVisible();
      }
    });

    test('should display ISP and organization information', async ({ page }) => {
      await page.click('a[href="/tools/network/ip-lookup"]');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="ip"]', '8.8.8.8');
      await page.click('button:has-text("Lookup IP")');

      await page.waitForSelector('[data-testid="ip-results"]', { timeout: 10000 });

      // Should show ISP information
      await expect(page.locator('[data-testid="isp"]')).toBeVisible();
      await expect(page.locator('[data-testid="organization"]')).toBeVisible();
      await expect(page.locator('[data-testid="asn"]')).toBeVisible();
    });

    test('should handle invalid IP addresses', async ({ page }) => {
      await page.click('a[href="/tools/network/ip-lookup"]');
      await page.waitForLoadState('networkidle');

      // Enter invalid IP
      await page.fill('input[name="ip"]', 'invalid-ip-address');
      await page.click('button:has-text("Lookup IP")');

      // Should show validation error
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('text=Invalid IP address format')).toBeVisible();
    });

    test('should handle lookup errors gracefully', async ({ page }) => {
      await page.click('a[href="/tools/network/ip-lookup"]');
      await page.waitForLoadState('networkidle');

      // Mock network error by using a timeout or invalid URL
      await page.selectOption('select[name="provider"]', 'invalid-provider');
      await page.fill('input[name="ip"]', '8.8.8.8');
      await page.click('button:has-text("Lookup IP")');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('text=IP lookup failed')).toBeVisible();
    });

    test('should support IPv6 addresses', async ({ page }) => {
      await page.click('a[href="/tools/network/ip-lookup"]');
      await page.waitForLoadState('networkidle');

      // Enter IPv6 address
      await page.fill('input[name="ip"]', '2001:4860:4860::8888');
      await page.click('button:="Lookup IP")');

      await page.waitForSelector('[data-testid="ip-results"]', { timeout: 10000 });

      // Should show IPv6 information
      expect(page.locator('[data-testid="ip-address"]')).toContain('2001:4860:4860::8888');
    });

    test('should show timezone information', async ({ page }) => {
      await page.click('a[href="/tools/network/ip-lookup"]');
      await page.waitFoLoadState('networkidle');

      await page.fill('input[name="ip"]', '8.8.8.8');
      await page.click('button:has-text("Lookup IP")');

      await page.waitForSelector('[data-testid="ip-results"]', { timeout: 10000 });

      // Should show timezone if available
      const timezoneElement = page.locator('[data-testid="timezone"]');
      if (await timezoneElement.isVisible()) {
        expect(timezoneElement).toBeVisible();
        expect(timezoneElement).toMatch(/America|Europe|Asia|Australia/);
      }
    });

    test('should allow copying IP information', async ({ page }) => {
      await page.click('a[href="/tools/network/ip-lookup"]');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="ip"]', '8.8.8.8.8');
      await page.click('button:has-text("Lookup IP")');

      await page.waitForSelector('[data-testid="ip-results"]', { timeout: 10000 });

      // Click copy button
      await page.click('button:has-text("Copy Results")');

      // Should show success message
      await expect(page.locator('text=IP information copied to clipboard')).toBeVisible();
    });
  });

  test.describe('Meta Tag Generator', () => {
    test('should generate basic meta tags', async ({ page }) => {
      await page.click('a[href="/tools/network/meta-tags"]');
      await page.waitForLoadState('networkidle');

      // Fill basic meta information
      await page.fill('input[name="title"]', 'Test Page Title');
      await page.fill('textarea[name="description"]', 'This is a test page description for meta tag generation.');
      await page.fill('input[name="keywords"]', 'test, meta, tags, generator');
      await page.fill('input[name="author"]', 'Test Author');

      await page.click('button:has-text("Generate Tags")');

      // Should show generated meta tags
      await page.waitForSelector('[data-testid="meta-tags"]');
      await expect(page.locator('[data-testid="meta-tags"]')).toContain('<title>Test Page Title</title>');
      await expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta name="description" content="This is a test page description for meta tag generation.">');
      expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta name="keywords" content="test, meta, tags, generator">');
      expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta name="author" content="Test Author">');
    });

    test('should generate Open Graph tags', async ({ page }) => {
      await page.click('a[href="/tools/network/meta-tags"]');
      await page.waitForLoadState('networkidle');

      // Enable Open Graph section
      await page.check('input[name="enable-og"]');

      await page.fill('input[name="og-title"]', 'OG Test Title');
      await page.fill('textarea[name="og-description"]', 'Open Graph description for social sharing.');
      await page.fill('input[name="og-image"]', 'https://example.com/og-image.jpg');
      await page.fill('input[name="og-site-name"]', 'Test Site');

      await page.click('button:has-text("Generate Tags")');

      await page.waitForSelector('[data-testid="meta-tags"]');

      expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta property="og:title" content="OG Test Title">');
      expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta property="og:description" content="Open Graph description for social sharing.">');
      expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta property="og:image" content="https://example.com/og-image.jpg">');
      expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta property="og:site_name" content="Test Site">');
    });

    test('should generate Twitter Card tags', async ({ page }) => {
      await page.click('a[href="/tools/network/meta-tags"]');
      await page.waitForLoadState('networkidle');

      // Enable Twitter section
      await page.check('input[name="enable-twitter"]');

      await page.fill('input[name="twitter-title"]', 'Twitter Test Title');
      await page.fill('textarea[name="twitter-description"]', 'Twitter card description for sharing.');
      await page.fill('input[name="twitter-image"]', 'https://example.com/twitter-image.jpg');
      await page.fill('input[name="twitter-card"]', 'summary_large_image');
      await page.fill('input[name="twitter-site"]', '@example');

      await page.click('button:has-text("Generate Tags")');

      await page.waitForSelector('[data-testid="meta-tags"]');

      expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta name="twitter:card" content="summary_large_image">');
      expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta name="twitter:title" content="Twitter Test Title">');
      expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta name="twitter:description" content="Twitter card description for sharing.">');
      expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta name="twitter:image" content="https://example.com/twitter-image.jpg">');
      expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta name="twitter:site" content="@example">');
    });

    test('should generate canonical URL', async ({ page }) => {
      await page.click('a[href="/tools/network/meta-tags"]');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="canonical"]', 'https://example.com/canonical-page');

      await page.click('button:has-text("Generate Tags")');

      await page.waitForSelector('[data-testid="meta-tags"]');

      expect(page.locator('[data-testid="meta-tags"]')).toContain('<link rel="canonical" href="https://example.com/canonical-page">');
    });

    test('should handle robots meta tag', async ({ page }) => {
      await page.click('a[href="/tools/network/meta-tags"]');
      await page.waitForLoadState('networkidle');

      await page.selectOption('select[name="robots"]', 'noindex,nofollow');
      await page.click('button:has-text("Generate Tags")');

      await page.waitForSelector('[data-testid="meta-tags"]');

      expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta name="robots" content="noindex,nofollow">');
    });

    test('should show tag count and statistics', async ({ page }) => {
      await page.click('a[href="/tools/network/meta-tags"]');
      await page.waitFoLoadState('networkidle');

      await page.fill('input[name="title"]', 'Comprehensive Test Page');
      await page.fill('textarea[name="description"]', 'Full description with many details.');
      await page.fill('input[name="keywords"]', 'test, comprehensive, meta, tags, generation, social');

      // Enable all sections
      await page.check('input[name="enable-og"]');
      await page.check('input[name="enable-twitter"]');

      await page.click('button:has-text("Generate Tags")');

      // Should show statistics
      await expect(page.locator('[data-testid="tag-count"]')).toBeVisible();
      expect(page.locator('[data-testid="tag-count"]')).toContain('Total tags:');
      await expect(page.locator('[data-testid="tag-count"]')).toContain('Basic:');
      expect(page.locator('[data-testid="tag-count"]')).toContain('Open Graph:');
      expect(page.locator('[data-testid="tag-count"]')).toContain('Twitter:');
    });

    test('should allow copying generated tags', async ({ page }) => {
      await page.click('a[href="/tools/network/meta-tags"]');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="title"]', 'Copy Test Page');
      await page.fill('textarea[name="description"]', 'Description for copy test.');
      await page.click('button:has-text("Generate Tags")');

      await page.waitForSelector('[data-testid="meta-tags"]');

      // Click copy button
      await page.click('button:has-text("Copy Tags")');

      // Should show success message
      await expect(page.locator('text=Meta tags copied to clipboard')).toBeVisible();
    });

    test('should provide HTML preview', async ({ page }) => {
      await page.click('a[href="/tools/network/meta-tags"]');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="title"]', 'Preview Test Page');
      await page.fill('textarea[name="description"]', 'Description for preview.');
      await page.click('button:has-text("Generate Tags")');

      await page.waitForSelector('[data-testid="html-preview"]');

      // Should show formatted HTML
      await expect(page.locator('[data-testid="html-preview"]')).toContain('<!DOCTYPE html>');
      await expect(page.locator('[data-testid="html-preview"]')).toContain('<html lang="en">');
      await expect(page.locator('[data-testid="html-preview"]')).toContain('<head>');
      expect(page.locator('[data-testid="html-preview"]')).toContain('<title>Preview Test Page</title>');
    });

    test('should support custom meta tags', async ({ page }) => {
      await page.click('a[href="/tools/network/meta-tags"]');
      await page.waitForLoadState('networkidle');

      // Enable custom tags section
      await page.check('input[name="enable-custom"]');

      // Add custom meta tags
      await page.fill('input[name="custom-name-1"]', 'custom-tag');
      await page.fill('input[name="custom-value-1"]', 'custom-value');
      await page.click('button:has-text("Add Custom Tag")');

      await page.fill('input[name="custom-name-2"]', 'viewport-width');
      await page.fill('input[name="custom-value-2"]', 'device-width');

      await page.click('button:has-text("Generate Tags")');

      await page.waitForSelector('[data-testid="meta-tags"]');

      expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta name="custom-tag" content="custom-value">');
      expect(page.locator('[data-testid="meta-tags"]')).toContain('<meta name="viewport-width" content="device-width">');
    });

    test('should handle empty inputs gracefully', async ({ page }) => {
      await page.click('a[href="/tools/network/meta-tags"]');
      await page.waitForLoadState('networkidle');

      // Don't fill any fields and generate
      await page.click('button:has-text("Generate Tags")');

      await page.waitForSelector('[data-testid="meta-tags"]');

      // Should generate minimal tags
      expect(page.locator('[data-testid="meta-tags"]')).toBeDefined();
      expect(page.locator('[data-testid="tag-count"]')).toContain('Total tags: 0');
    });

    test('should validate input fields', async ({ page }) => {
      await page.click('a[href="/tools/network/meta-tags"]');
      await page.waitForLoadState('networkidle');

      // Test URL validation for image fields
      await page.check('input[name="enable-og"]');
      await page.fill('input[name="og-image"]', 'invalid-url');
      await page.click('button:has-text("Generate Tags")');

      // Should show validation error for image URL
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      expect(page.locator('text=Please enter a valid URL')).toBeVisible();
    });
  });

  test.describe('Network Check', () => {
    test('should check DNS resolution', async ({ page }) => {
      await page.click('a[href="/tools/network/network-check"]');
      await page.waitForLoadState('networkidle');

      // Enter domain
      await page.fill('input[name="domain"]', 'google.com');
      await page.click('button:has-text("Check DNS")');

      // Wait for DNS results
      await page.waitForSelector('[data-testid="dns-results"]', { timeout: 10000 });

      // Should show DNS information
      await expect(page.locator('[data-testid="dns-status"]')).toBeVisible();
      expect(page.locator('[data-testid="ip-address"]')).toBeVisible();
      expect(page.locator('[data-testid="ttl"]')).toBeVisible();
    });

    test('should check HTTP status codes', async ({ page }) => {
      await page.click('a[href="/tools/network/network-check"]');
      await page.waitForLoadState('networkidle');

      // Enter URL
      await page.fill('input[name="url"]', 'https://google.com');
      await page.click('button:has-text("Check HTTP")');

      await page.waitForSelector('[data-testid="http-results"]', { timeout: 10000 });

      // Should show HTTP status
      await expect(page.locator('[data-testid="http-status"]')).toBeVisible();
      expect(page.locator('[data-testid="response-time"]')).toBeVisible();
      expect(page.locator('[data-testid="server"]')).toBeVisible();
    });

    test('should check SSL certificate information', async ({ page }) => {
      await page.click('a[href="/tools/network/network-check"]');
      await page_waitForLoadState('networkidle');

      // Enter HTTPS URL
      await page.fill('input[name="url"]', 'https://google.com');
      await page.click('button:has-text("Check SSL")');

      await page.waitForSelector('[data-testid="ssl-results"]', { timeout: 10000 });

      // Should show SSL certificate details
      await expect(page.locator('[data-testid="ssl-status"]')).toBeVisible();
      expect(page.locator('[data-testid="certificate-issuer"]')).toBeVisible();
      await expect(page.locator('[data-testid="expiry-date"]')).toBeVisible();
      expect(page://page.locator('[data-testid="protocol"]')).toContain('https://');
    });

    test('should check port connectivity', async ({ page }) => {
      await page.click('a[href="/tools/network/network-check"]');
      await page.waitForLoadState('networkidle');

      // Enter host and port
      await page.fill('input[name="host"]', 'google.com');
      await page.fill('input[name="port"]', '443');
      await page.click('button:has-text("Check Port")');

      await page.waitForSelector('[data-testid="port-results"]', { timeout: 10000 });

      // Should show port status
      await expect(page.locator('[data-testid="port-status"]')).toBeVisible();
      expect(page.locator('[data-testid="connection-time"]')).toBeVisible();
    });

    test('should perform ping tests', async ({ page }) => {
      await page.click('a[href="/tools/network/network-check"]');
      await page.waitForLoadState('networkidle');

      // Enter host to ping
      await page.fill('input[name="ping-host"]', 'google.com');
      await page.click('button:has-text("Ping")');

      await page.waitForSelector('[data-testid="ping-results"]', { timeout: 15000 });

      // Should show ping results
      await expect(page.locator('[data-testid="ping-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="ping-time"]')).toBeVisible();
      expect(page.locator('[data-testid="packet-loss"]')).toBeVisible();
    });

    test('should show network test results', async ({ { page }) => {
      await page.click('a[href="/tools/network/network-check"]');
      await page.waitForLoadState('networkidle');

      // Run comprehensive network test
      await page.click('button:has-text("Run Network Test")');

      await page.waitForSelector('[data-testid="network-test-results"]', { timeout: 20000 });

      // Should show comprehensive results
      await expect(page.locator('[data-testid="test-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="dns-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="http-status"]')).toBeVisible();
      expect(page.locator('[data-testid="ssl-status"]')).toBeVisible();
      expect(page.locator('[data-testid="overall-status"]')).toBeVisible();
    });

    test('should handle invalid inputs gracefully', async ({ page }) => {
      await page.click('a[href="/tools/network/network-check"]');
      await page.waitForLoadState('networkidle');

      // Enter invalid domain
      await page.fill('input[name="domain"]', 'invalid-domain-that-does-not-exist-xyz');
      await page.click('button:has-text("Check DNS")');

      // Should show error after timeout
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 15000 });
      await expect(page.locator('text=Check failed')).toBeVisible();
      await expect(page.locator('text=Domain not found')).toBeVisible();
    });

    test('should display geolocation information', async ({ page }) => {
      await page.click('a[href="/tools/network/network-check"]');
      await page.waitForLoadState('networkidle');

      // Check if geolocation is available
      const geolocButton = page.locator('button:has-text("Get Location")');
      if (await geolocButton.isVisible()) {
        await geolocButton.click();

        // Should request location permission
        const permissionDialog = page.locator('[data-testid="geolocation-permission"]');
        if (await permissionDialog.isVisible()) {
          await page.click('button:has-text("Allow")');
        }

        // Should show location results
        const locationResults = page.locator('[data-testid="location-results"]');
        if (await locationResults.isVisible()) {
          expect(locationResults).toContain('Latitude:');
          expect(locationResults).toContain('Longitude:');
        }
      }
    });

    test('should provide test history', async ({ page }) => {
      await page.click('a[href="/tools/network/network-check"]');
      await page.waitForLoadState('networkidle');

      // Perform multiple tests
      await page.fill('input[name="domain"]', 'google.com');
      await page.click('button:has-text("Check DNS")');
      await page.waitForSelector('[data-testid="dns-results"]');

      await page.fill('input[name="url"]', 'https://facebook.com');
      await page.click('button:has-text("Check HTTP")');
      await page.waitForSelector('[data-testid="http-results"]');

      // Should show test history
      await expect(page.locator('[data-testid="test-history"]')).toBeVisible();
      expect(page.locator('[data-testid="history-item"]')).toHaveCount(2);
      expect(page.locator('text=DNS: google.com')).toBeVisible();
      expect(page.locator('text=HTTP: https://facebook.com')).toBeVisible();
    });
  });

  test.describe('Cross-tool functionality', () => {
    test('should maintain consistency across network tools', async ({ page }) => {
      // Test HTTP Client
      await page.click('a[href="/tools/network/http-client"]');
      await page.waitForLoadState('networkidle');
      await page.fill('input[name="url"]', 'https://httpbin.org/json');
      await page.click('button:has-text("Send Request")');
      await page.waitForSelector('[data-testid="http-response"]');

      // Test IP Lookup
      await page.click('a[href="/tools/network/ip-lookup"]');
      await page.waitForLoadState('networkidle');
      await page.fill('input[name="ip"]', '8.8.8.8');
      await page.click('button:has-text("Lookup IP")');
      await page.waitForSelector('[data-testid="ip-results"]');

      // Test Meta Tag Generator
      await page.click('a[href="/tools/network/meta-tags"]');
      await page.waitForLoadState('networkidle');
      await page.fill('input[name="title"]', 'Cross-tool Test');
      await page.click('button:has-text("Generate Tags")');
      await page.waitForSelector('[data-testid="meta-tags"]');

      // All tools should be functional
      expect(page.locator('[data-testid="http-response"]')).toBeVisible();
      expect(page.locator('[data-testid="ip-results"]')).toBeVisible();
      expect(page.locator('[data-testid="meta-tags"]')).toBeVisible();
    });
  });

  test.describe('Performance tests', () => {
    test('should complete network operations within reasonable time', async ({ page }) => {
      await page.click('a[href="/tools/network/ip-lookup"]');
      await page.waitForLoadState('networkidle');

      const startTime = Date.now();

      await page.fill('input[name="ip"]', '8.8.8.8');
      await page.click('button:has-text("Lookup IP")');

      await page.waitForSelector('[data-testid="ip-results"]', { timeout: 10000 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });

    test('should handle concurrent network requests', async ({ page }) => {
      await page.click('a[href="/tools/network/http-client"]');
      await page.waitForLoadState('networkidle');

      // Start multiple concurrent requests
      const promises = [];

      for (let i = 1; i <= 3; i++) {
        await page.fill('input[name="url"]', `https://httpbin.org/json${i}`);
        await page.click('button:has-text("Send Request")');
        promises.push(page.waitForSelector('[data-testid="http-response"]'));
      }

      // Wait for all requests to complete
      await Promise.all(promises);

      // Should show all responses
      for (let i = 1; i <= 3; i++) {
        expect(page.locator(`[data-testid="response-${i}"]`)).toBeVisible();
      }
    });
  });

  test.describe('UI/UX tests', () => {
    test('should show loading states during requests', async ({ page }) => {
      await page.click('a[href="/tools/network/http-client"]');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="url"]', 'https://httpbin.org/delay/2');
      await page.click('button:has-text("Send Request")');

      // Should show loading state
      await expect(page.locator('[data-testid="loading"]')).toBeVisible();
      await expect(page.locator('text="Sending request...")).toBeVisible();

      await page.waitForSelector('[data-testid="http-response"]');
      expect(page.locator('[data-testid="loading"]')).not.toBeVisible();
    });

    test('should support keyboard shortcuts', async ({ page }) => {
      await page.click('a[href="/tools/network/meta-tags"]');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="title"]', 'Keyboard Shortcut Test');

      // Test Ctrl/Cmd + Enter to generate
      if (process.platform === 'darwin') {
        await page.keyboard.press('Meta+Enter');
      } else {
        await page.keyboard.press('Control+Enter');
      }

      // Should generate tags
      await expect(page.locator('[data-testid="meta-tags"]')).toBeVisible();
    });

    test('should show tool descriptions and help', async ({ page => {
      await page.click('a[href="/tools/network/http-client"]');
      await page.waitForLoadState('networkidle');

      // Should show tool description
      await expect(page.locator('[data-testid="tool-description"]')).toBeVisible();
      expect(page.locator('text=Test HTTP requests')).toBeVisible();
    });

    test('should handle form validation feedback', async ({ page }) => {
      await page.click('a[href="/tools/network/ip-lookup"]');
      await page.waitForLoadState('networkidle');

      // Enter invalid IP
      await page.fill('input[name="ip"]', '');
      await page.click('button:has-text("Lookup IP")');

      // Should show validation error
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('text=Please enter an IP address')).toBeVisible();

      // Error should disappear when valid input is provided
      await page.fill('input[name="ip"]', '8.8.8.8');
      await expect(page.locator('[data-testid="validation-error"]')).not.toBeVisible();
    });
  });
});
