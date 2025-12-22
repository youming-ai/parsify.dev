import type { SEOProps } from '@/types/seo';
import { JsonLd } from './json-ld';

interface HeadProps extends SEOProps {
  url: string;
  type?: 'website' | 'article';
  siteName?: string;
  locale?: string;
}

export function Head({
  title,
  description,
  keywords = [],
  image,
  noIndex = false,
  structuredData = [],
  breadcrumb,
  url,
  type = 'website',
  siteName = 'Parsify.dev',
  locale = 'en_US',
}: HeadProps) {
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultImage = 'https://parsify.dev/og-image.png';
  const imageUrl = image || defaultImage;

  const metaTags = [
    { name: 'description', content: description },
    { name: 'keywords', content: keywords.join(', ') },
    { name: 'author', content: 'Parsify.dev Team' },

    // Open Graph
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: siteName },
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:locale', content: locale },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:site', content: '@parsifydev' },

    // Robots
    { name: 'robots', content: noIndex ? 'noindex, nofollow' : 'index, follow' },
    { name: 'googlebot', content: noIndex ? 'noindex, nofollow' : 'index, follow' },
  ];

  const structuredDataWithBreadcrumb = [...structuredData];

  if (breadcrumb && breadcrumb.length > 0) {
    structuredDataWithBreadcrumb.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumb.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    });
  }

  return (
    <>
      {metaTags.map((tag, index) => {
        if ('property' in tag) {
          return <meta key={`og-${index}`} property={tag.property} content={tag.content} />;
        }
        return <meta key={`meta-${index}`} name={tag.name} content={tag.content} />;
      })}

      <link rel="canonical" href={url} />

      {structuredDataWithBreadcrumb.map((data, index) => (
        <JsonLd key={`json-ld-${index}`} data={data} />
      ))}
    </>
  );
}
