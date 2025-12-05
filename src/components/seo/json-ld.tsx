'use client';

import { useEffect } from 'react';

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Component to inject JSON-LD structured data into the page
 * This helps search engines understand the content and can enable rich results
 */
export function JsonLd({ data }: JsonLdProps) {
  // For arrays of JSON-LD objects, we create multiple script tags
  const dataArray = Array.isArray(data) ? data : [data];

  return (
    <>
      {dataArray.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item),
          }}
        />
      ))}
    </>
  );
}

/**
 * Hook to dynamically update page metadata
 * Useful for client-side rendered pages
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
