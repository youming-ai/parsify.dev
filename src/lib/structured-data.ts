import type { Tool } from '@/types/tools';
import { SEO_CONFIG } from './seo-config';

interface StructuredDataProps {
  type: 'WebPage' | 'WebSite' | 'SoftwareApplication';
  name: string;
  description: string;
  url: string;
  tool?: Tool;
  breadcrumb?: Array<{ name: string; url: string }>;
}

export function generateStructuredData({
  type,
  name,
  description,
  url,
  tool,
  breadcrumb,
}: StructuredDataProps) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    description,
    url,
    publisher: {
      '@type': 'Organization',
      name: SEO_CONFIG.SITE_NAME,
      url: SEO_CONFIG.BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SEO_CONFIG.BASE_URL}/logo.png`,
        width: 512,
        height: 512,
      },
    },
  };

  if (type === 'WebSite') {
    return {
      ...baseData,
      '@type': 'WebSite' as const,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SEO_CONFIG.BASE_URL}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };
  }

  if (type === 'SoftwareApplication' && tool) {
    return {
      ...baseData,
      '@type': 'SoftwareApplication' as const,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: tool.features,
      keywords: tool.tags.join(', '),
      softwareVersion: '1.0',
      author: {
        '@type': 'Organization',
        name: 'Parsify.dev Team',
      },
    };
  }

  if (type === 'WebPage' && breadcrumb) {
    return {
      ...baseData,
      '@type': 'WebPage' as const,
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumb.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      },
      mainContentOfPage: {
        '@type': 'WebPageElement',
        cssSelector: '.main-content',
      },
    };
  }

  return baseData;
}

export function generateBreadcrumbJsonLd(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
