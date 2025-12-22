import { toolsData } from '@/data/tools-data';
import { generatePageMetadata } from '@/lib/metadata';
import { CATEGORY_SLUG_MAP, SEO_CONFIG } from '@/lib/seo-config';
import { generateStructuredData } from '@/lib/structured-data';
import type { Metadata } from 'next';

interface GenerateToolSEOProps {
  toolId: string;
  customTitle?: string;
  customDescription?: string;
  extraKeywords?: string[];
}

export function generateToolSEOMetadata({
  toolId,
  customTitle,
  customDescription,
  extraKeywords = [],
}: GenerateToolSEOProps): Metadata {
  const tool = toolsData.find((t) => t.id === toolId);

  if (!tool) {
    return generatePageMetadata({
      title: 'Tool Not Found',
      description: 'The requested tool could not be found.',
      path: '/not-found',
      noIndex: true,
    });
  }

  return generatePageMetadata({
    title: customTitle || tool.name,
    description: customDescription || tool.description,
    path: tool.href,
    keywords: [...tool.tags, ...extraKeywords],
  });
}

export function generateToolStructuredData(toolId: string) {
  const tool = toolsData.find((t) => t.id === toolId);

  if (!tool) return [];

  const categorySlug = CATEGORY_SLUG_MAP[tool.category] || 'tools';

  return [
    generateStructuredData({
      type: 'SoftwareApplication',
      name: tool.name,
      description: tool.description,
      url: `${SEO_CONFIG.BASE_URL}${tool.href}`,
      tool,
    }),
    generateStructuredData({
      type: 'WebPage',
      name: `${tool.name} - ${tool.description}`,
      description: tool.description,
      url: `${SEO_CONFIG.BASE_URL}${tool.href}`,
      breadcrumb: [
        { name: 'Home', url: SEO_CONFIG.BASE_URL },
        { name: tool.category, url: `${SEO_CONFIG.BASE_URL}/${categorySlug}` },
        { name: tool.name, url: `${SEO_CONFIG.BASE_URL}${tool.href}` },
      ],
    }),
  ];
}
