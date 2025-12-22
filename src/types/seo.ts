export interface StructuredData {
  '@context': string;
  '@type': 'WebPage' | 'WebSite' | 'SoftwareApplication' | 'BreadcrumbList' | 'Organization';
  name?: string;
  description?: string;
  url?: string;
  [key: string]: any;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
  structuredData?: StructuredData[];
  breadcrumb?: BreadcrumbItem[];
}
