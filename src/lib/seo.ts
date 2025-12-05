import { toolsData } from '@/data/tools-data';
import type { Tool } from '@/types/tools';
import type { Metadata } from 'next';

const BASE_URL = 'https://parsify.dev';

/**
 * Generate metadata for a tool page
 */
export function generateToolMetadata(tool: Tool): Metadata {
  const title = `${tool.name} - Free Online ${tool.category} Tool | Parsify.dev`;
  const description = `${tool.description} Free, secure, and runs entirely in your browser. No data sent to servers.`;

  return {
    title,
    description,
    keywords: [
      ...tool.tags,
      tool.category,
      'online tool',
      'free',
      'browser-based',
      'developer tool',
    ],
    authors: [{ name: 'Parsify.dev Team' }],
    creator: 'Parsify.dev',
    publisher: 'Parsify.dev',
    alternates: {
      canonical: `${BASE_URL}${tool.href}`,
    },
    openGraph: {
      title,
      description: tool.description,
      type: 'website',
      url: `${BASE_URL}${tool.href}`,
      siteName: 'Parsify.dev',
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${tool.name} - Parsify.dev`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: tool.description,
      images: [`${BASE_URL}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': '-1',
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Generate JSON-LD structured data for a tool page
 */
export function generateToolJsonLd(tool: Tool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.description,
    url: `${BASE_URL}${tool.href}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: tool.features,
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    permissions: 'none',
    isAccessibleForFree: true,
    creator: {
      '@type': 'Organization',
      name: 'Parsify.dev',
      url: BASE_URL,
    },
  };
}

/**
 * Generate JSON-LD structured data for the homepage
 */
export function generateHomeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Parsify.dev',
    description:
      'Professional online developer tools for JSON processing, code execution, file transformation, and more. Run securely in your browser with no data sent to servers.',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Parsify.dev',
      url: BASE_URL,
    },
  };
}

/**
 * Generate JSON-LD structured data for the organization
 */
export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Parsify.dev',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      'Professional online developer tools for JSON processing, code execution, file transformation, and more.',
    sameAs: [
      // Add social media links when available
      // 'https://twitter.com/parsifydev',
      // 'https://github.com/parsify-dev',
    ],
  };
}

/**
 * Get tool by slug from href
 */
export function getToolByHref(href: string): Tool | undefined {
  return toolsData.find((tool) => tool.href === href);
}

/**
 * Generate breadcrumb JSON-LD
 */
export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate FAQ JSON-LD for tool pages
 */
export function generateToolFaqJsonLd(tool: Tool) {
  const faqs = [
    {
      question: `What is ${tool.name}?`,
      answer: tool.description,
    },
    {
      question: `Is ${tool.name} free to use?`,
      answer: `Yes, ${tool.name} is completely free to use. It runs entirely in your browser with no data sent to servers.`,
    },
    {
      question: `Is my data safe when using ${tool.name}?`,
      answer:
        tool.security === 'local-only'
          ? 'Yes, all processing happens locally in your browser. Your data never leaves your device and is not stored or transmitted to any server.'
          : 'This tool may require network access for some features, but your data is handled securely.',
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
