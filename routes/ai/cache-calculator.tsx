import { CacheCalculator } from '@/components/tools/ai/cache-calculator';
import { useDocumentHead } from '@/components/seo/head';
import { softwareApplicationJsonLd } from '@/lib/seo-config';
import { toolsData } from '@/data/tools-data';
import { createFileRoute } from '@tanstack/react-router';

const tool = toolsData.find((t) => t.id === 'cache-calculator')!;

function CacheCalculatorPage() {
  useDocumentHead({
    title: tool.name,
    description: tool.description,
    path: tool.href,
    ogType: 'article',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'AI & LLM Tools', url: '/ai' },
      { name: tool.name, url: tool.href },
    ],
    extraJsonLd: softwareApplicationJsonLd(tool),
  });

  return (
    <main id="main-content" className="container mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <CacheCalculator />
    </main>
  );
}

export const Route = createFileRoute('/ai/cache-calculator')({
  component: CacheCalculatorPage,
});
