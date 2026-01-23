import { SEO_CONFIG } from '@/lib/seo-config';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow all user agents by default, block specific paths
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/_next/', '/private/', '/admin/'],
      },
      // Specific rules for Googlebot
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/_next/'],
      },
      // Specific rules for Bingbot
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/_next/'],
      },
      // Optimize for popular crawlers
      {
        userAgent: ['Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot'],
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/_next/'],
      },
      // Block common AI scrapers and bots
      {
        userAgent: ['ChatGPT-User', 'GPTBot', 'CCBot', 'anthropic-ai', 'ClaudeBot'],
        disallow: '/',
      },
      // Crawl delay to prevent server overload
      {
        userAgent: ['Googlebot', 'Bingbot', 'Slurp'],
        crawlDelay: 1,
      },
    ],
    sitemap: `${SEO_CONFIG.BASE_URL}/sitemap.xml`,
    host: SEO_CONFIG.BASE_URL,
  };
}
