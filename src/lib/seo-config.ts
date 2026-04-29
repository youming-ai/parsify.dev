/**
 * Centralized SEO configuration to avoid duplicate constants across files
 */

export const SEO_CONFIG = {
  BASE_URL: 'https://parsify.dev',
  SITE_NAME: 'Parsify.dev',
  DEFAULT_TITLE: 'Parsify.dev - AI & LLM Developer Tools',
  DEFAULT_DESCRIPTION:
    'Privacy-first browser tools for AI agent and LLM developers. Token counter, cost calculator, tool schema converter, text chunker, SSE parser, and more. All processing happens in your browser.',
  DEFAULT_OG_IMAGE: 'https://parsify.dev/og-image.png',
  TWITTER_HANDLE: '@parsifydev',
} as const;

export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'AI & LLM Tools': 'ai',
} as const;

export const CATEGORY_NAME_MAP: Record<string, string> = {
  ai: 'AI & LLM Tools',
} as const;
