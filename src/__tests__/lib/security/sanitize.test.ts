import { describe, expect, it, vi } from 'vitest';

vi.mock('dompurify', () => ({
  default: {
    sanitize: (html: string, config?: Record<string, unknown>) => {
      if (!html) return '';

      let sanitized = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '');

      const dangerousAttrs = ['onclick', 'onerror', 'onload', 'onmouseover'];
      dangerousAttrs.forEach((attr) => {
        const attrPattern = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
        sanitized = sanitized.replace(attrPattern, '');
      });

      sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
      sanitized = sanitized.replace(/href\s*=\s*["']data:[^"']*["']/gi, '');

      const allowedTagsConfig = config?.ALLOWED_TAGS;
      if (Array.isArray(allowedTagsConfig)) {
        const allowedTags = allowedTagsConfig.filter(
          (tag): tag is string => typeof tag === 'string'
        );
        const tagRegex = /<(\w+)[^>]*>/g;
        sanitized = sanitized.replace(tagRegex, (match, tag) => {
          const tagName = String(tag).toLowerCase();
          if (allowedTags.includes(tagName)) {
            const allowedAttrsConfig = config?.ALLOWED_ATTR;
            if (Array.isArray(allowedAttrsConfig)) {
              const allowedAttrs = allowedAttrsConfig.filter(
                (attr): attr is string => typeof attr === 'string'
              );
              const attrRegex = /(\w+)=["'][^"']*["']/g;
              let filtered = match;
              filtered = filtered.replace(attrRegex, (attrMatch, attrName) => {
                if (allowedAttrs.includes(String(attrName).toLowerCase())) {
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

      if (config?.ALLOW_DATA_ATTR === false) {
        sanitized = sanitized.replace(/\sdata-[^=]*="[^"]*"/gi, '');
      }

      return sanitized;
    },
  },
}));

import { sanitizeHtml } from '../../../lib/security/sanitize';

describe('sanitizeHtml', () => {
  it('strips script tags', () => {
    const input = '<p>safe</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);

    expect(result).toContain('<p>safe</p>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert("xss")');
  });

  it('strips onclick and other event handlers', () => {
    const input = '<a href="https://example.com" onclick="evil()" onmouseover="evil2()">link</a>';
    const result = sanitizeHtml(input);

    expect(result).toContain('<a href="https://example.com">link</a>');
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('onmouseover');
  });

  it('allows safe tags', () => {
    const input =
      '<b>bold</b><i>italic</i><em>em</em><strong>strong</strong><a>link</a><code>x</code><pre>y</pre>';
    const result = sanitizeHtml(input);

    expect(result).toContain('<b>bold</b>');
    expect(result).toContain('<i>italic</i>');
    expect(result).toContain('<em>em</em>');
    expect(result).toContain('<strong>strong</strong>');
    expect(result).toContain('<a>link</a>');
    expect(result).toContain('<code>x</code>');
    expect(result).toContain('<pre>y</pre>');
  });

  it('strips javascript href values', () => {
    const input = '<a href="javascript:alert(1)">bad</a>';
    const result = sanitizeHtml(input);

    expect(result).not.toContain('javascript:');
    expect(result).toContain('bad</a>');
  });

  it('preserves safe href values', () => {
    const input = '<a href="https://parsify.dev" rel="noopener" target="_blank">safe link</a>';
    const result = sanitizeHtml(input);

    expect(result).toContain('href="https://parsify.dev"');
    expect(result).toContain('rel="noopener"');
    expect(result).toContain('target="_blank"');
  });

  it('strips style attribute', () => {
    const input = '<span style="color:red" class="ok">styled</span>';
    const result = sanitizeHtml(input);

    expect(result).toContain('class="ok"');
    expect(result).toContain('styled</span>');
    expect(result).not.toContain('style=');
  });

  it('handles empty string input', () => {
    const result = sanitizeHtml('');
    expect(result).toBe('');
  });

  it('passes through plain text', () => {
    const result = sanitizeHtml('just plain text');
    expect(result).toBe('just plain text');
  });
});
