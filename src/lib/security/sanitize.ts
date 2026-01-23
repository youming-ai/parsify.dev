'use client';

import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses DOMPurify with a moderate tag and attribute whitelist.
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre', 'span'],
    ALLOWED_ATTR: ['href', 'class', 'style', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
  });
}

/**
 * Sanitizes HTML with custom configuration options.
 *
 * @param html - The HTML string to sanitize
 * @param options - Custom configuration options
 * @returns Sanitized HTML string
 */
export function sanitizeHtmlWithConfig(
  html: string,
  options?: {
    allowedTags?: string[];
    allowedAttrs?: string[];
  }
): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: options?.allowedTags,
    ALLOWED_ATTR: options?.allowedAttrs,
    ALLOW_DATA_ATTR: false,
  });
}
