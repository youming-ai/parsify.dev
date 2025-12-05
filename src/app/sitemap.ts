import { toolsData } from '@/data/tools-data';
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://parsify.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/tools`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Tool pages - dynamically generated from tools data
  const toolPages: MetadataRoute.Sitemap = toolsData.map((tool) => ({
    url: `${BASE_URL}${tool.href}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: tool.isPopular ? 0.9 : 0.8,
  }));

  // Category pages
  const categories = Array.from(new Set(toolsData.map((tool) => tool.category)));
  const categorySlugMap: Record<string, string> = {
    'Data Format & Conversion': 'data-format',
    'Security & Authentication': 'security',
    'Development & Testing': 'development',
    'Network & Web': 'network',
    'File Tools': 'file',
    Utility: 'utility',
  };

  const categoryPages: MetadataRoute.Sitemap = categories
    .filter((cat) => categorySlugMap[cat])
    .map((category) => ({
      url: `${BASE_URL}/tools/${categorySlugMap[category]}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  return [...staticPages, ...toolPages, ...categoryPages];
}
