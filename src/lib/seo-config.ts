/**
 * Centralized SEO configuration to avoid duplicate constants across files
 */

export const SEO_CONFIG = {
  BASE_URL: 'https://parsify.dev',
  SITE_NAME: 'Parsify.dev',
  DEFAULT_TITLE: 'Parsify — URL to AI-Ready Markdown, Instantly',
  DEFAULT_DESCRIPTION:
    'Paste any URL. Parsify fetches, cleans, and converts it into clean, structured Markdown — optimized for LLMs, RAG pipelines, and note-taking apps.',
  DEFAULT_OG_IMAGE: 'https://parsify.dev/opengraph-image.png',
  DEFAULT_OG_IMAGE_WIDTH: 1200,
  DEFAULT_OG_IMAGE_HEIGHT: 630,
  DEFAULT_LOCALE: 'en_US',
  TWITTER_HANDLE: '@parsifydev',
} as const;
