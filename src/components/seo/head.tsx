import { useEffect } from 'react';
import { SEO_CONFIG } from '~/lib/seo-config';

interface Breadcrumb {
  name: string;
  url: string;
}

interface HeadProps {
  title: string;
  description: string;
  path: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  appendSiteName?: boolean;
  breadcrumbs?: Breadcrumb[];
  extraJsonLd?: object;
}

export function useDocumentHead({
  title,
  description,
  path,
  ogType = 'website',
  ogImage = SEO_CONFIG.DEFAULT_OG_IMAGE,
  appendSiteName = true,
  breadcrumbs,
  extraJsonLd,
}: HeadProps) {
  const fullTitle =
    appendSiteName && !title.includes('Parsify.dev') ? `${title} | Parsify.dev` : title;
  const url = new URL(path, SEO_CONFIG.BASE_URL).toString();

  useEffect(() => {
    document.title = fullTitle;

    setMeta('description', description);
    setLink('canonical', url);
    setMetaProperty('og:title', fullTitle);
    setMetaProperty('og:description', description);
    setMetaProperty('og:type', ogType);
    setMetaProperty('og:url', url);
    setMetaProperty('og:site_name', SEO_CONFIG.SITE_NAME);
    setMetaProperty('og:locale', SEO_CONFIG.DEFAULT_LOCALE);
    setMetaProperty('og:image', ogImage);
    setMetaProperty('og:image:width', String(SEO_CONFIG.DEFAULT_OG_IMAGE_WIDTH));
    setMetaProperty('og:image:height', String(SEO_CONFIG.DEFAULT_OG_IMAGE_HEIGHT));
    setMetaName('twitter:card', 'summary_large_image');
    setMetaName('twitter:site', SEO_CONFIG.TWITTER_HANDLE);
    setMetaName('twitter:title', fullTitle);
    setMetaName('twitter:description', description);
    setMetaName('twitter:image', ogImage);

    const jsonLdScripts: object[] = [];

    if (breadcrumbs && breadcrumbs.length > 0) {
      jsonLdScripts.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: crumb.name,
          item: new URL(crumb.url, SEO_CONFIG.BASE_URL).toString(),
        })),
      });
    }

    if (extraJsonLd) {
      jsonLdScripts.push(extraJsonLd);
    }

    const existingScripts = document.querySelectorAll('script[data-seo-jsonld]');
    for (const s of existingScripts) s.remove();

    for (const jsonLd of jsonLdScripts) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', '');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [fullTitle, description, url, ogType, ogImage, breadcrumbs, extraJsonLd]);
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaName(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}
