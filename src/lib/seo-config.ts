/**
 * Centralized SEO configuration to avoid duplicate constants across files
 */

export const SEO_CONFIG = {
  BASE_URL: 'https://parsify.dev',
  SITE_NAME: 'Parsify.dev',
  DEFAULT_TITLE: 'SEO Analyzer — URL to SEO Analysis, Instantly',
  DEFAULT_DESCRIPTION:
    'Paste any URL and get comprehensive SEO analysis with SEO.md, robots.txt, and llm.txt. AI-powered SEO optimization for your website.',
  DEFAULT_OG_IMAGE: 'https://parsify.dev/opengraph-image.png',
  DEFAULT_OG_IMAGE_WIDTH: 1200,
  DEFAULT_OG_IMAGE_HEIGHT: 630,
  DEFAULT_LOCALE: 'en_US',
  TWITTER_HANDLE: '@parsifydev',
} as const;
