/**
 * Centralized SEO configuration to avoid duplicate constants across files
 */

export const SEO_CONFIG = {
  BASE_URL: 'https://parsify.dev',
  SITE_NAME: 'Parsify.dev',
  DEFAULT_TITLE: 'Parsify.dev - Professional Developer Tools',
  DEFAULT_DESCRIPTION:
    'Professional online developer tools for JSON processing, code execution, file transformation, and more. Run securely in your browser with no data sent to servers.',
  DEFAULT_OG_IMAGE: 'https://parsify.dev/og-image.png',
  TWITTER_HANDLE: '@parsifydev',
} as const;

export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'Data Format & Conversion': 'data-format',
  'Security & Authentication': 'security',
  'Development & Testing': 'development',
  'Network & Utility': 'network',
} as const;

export const CATEGORY_NAME_MAP: Record<string, string> = {
  'data-format': 'Data Format & Conversion',
  security: 'Security & Authentication',
  development: 'Development & Testing',
  network: 'Network & Utility',
  utility: 'Network & Utility',
} as const;
