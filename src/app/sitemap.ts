import { toolsData } from '@/data/tools-data';
import { CATEGORY_SLUG_MAP, SEO_CONFIG } from '@/lib/seo-config';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SEO_CONFIG.BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];

  // Tool pages - dynamically generated from tools data
  const toolPages: MetadataRoute.Sitemap = toolsData.map((tool) => ({
    url: `${SEO_CONFIG.BASE_URL}${tool.href}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: tool.isPopular ? 0.9 : 0.8,
  }));

  // Category pages
  const categories = Array.from(new Set(toolsData.map((tool) => tool.category)));

  const categoryPages: MetadataRoute.Sitemap = categories
    .filter((cat) => CATEGORY_SLUG_MAP[cat])
    .map((category) => ({
      url: `${SEO_CONFIG.BASE_URL}/${CATEGORY_SLUG_MAP[category]}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [...staticPages, ...toolPages, ...categoryPages];
}
