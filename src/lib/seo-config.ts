/**
 * Centralized SEO configuration to avoid duplicate constants across files
 */

export const SEO_CONFIG = {
  BASE_URL: 'https://parsify.dev',
  SITE_NAME: 'Parsify.dev',
  DEFAULT_TITLE: 'Parsify — URL to AI-Ready Markdown, Instantly',
  DEFAULT_DESCRIPTION:
    'Paste any URL and get clean, structured Markdown — instantly ready for your AI. Strips ads, navigation, and boilerplate. One-click AI summary included.',
  DEFAULT_OG_IMAGE: 'https://parsify.dev/opengraph-image.png',
  DEFAULT_OG_IMAGE_WIDTH: 1200,
  DEFAULT_OG_IMAGE_HEIGHT: 630,
  DEFAULT_LOCALE: 'en_US',
  TWITTER_HANDLE: '@parsifydev',
} as const;

export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'AI & LLM Tools': 'ai',
} as const;

export const CATEGORY_NAME_MAP: Record<string, string> = {
  ai: 'AI & LLM Tools',
} as const;

interface ToolForSchema {
  id: string;
  name: string;
  description: string;
  href: string;
  features?: readonly string[];
}

/**
 * Build a schema.org SoftwareApplication JSON-LD payload for a tool page.
 * Targets the Google "Software App" rich result.
 */
export function softwareApplicationJsonLd(tool: ToolForSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: `${SEO_CONFIG.BASE_URL}${tool.href}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    ...(tool.features && tool.features.length > 0 ? { featureList: [...tool.features] } : {}),
    publisher: {
      '@type': 'Organization',
      name: SEO_CONFIG.SITE_NAME,
      url: SEO_CONFIG.BASE_URL,
    },
  };
}
