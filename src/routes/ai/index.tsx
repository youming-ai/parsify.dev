import { createFileRoute } from '@tanstack/react-router';
import { useDocumentHead } from '@/components/seo/head';
import { AI_TOOLS_CATEGORY, toolsData } from '@/data/tools-data';

const tools = toolsData.filter((tool) => tool.category === AI_TOOLS_CATEGORY);
const title = 'AI & LLM Developer Tools';
const desc =
  'Privacy-first browser tools for AI agent and LLM application developers — cost calculators, cache analysis, SSE stream parsers, and JSONL editors.';

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: title,
  description: desc,
  url: 'https://parsify.dev/ai',
  hasPart: tools.map((tool) => ({
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: `https://parsify.dev${tool.href}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  })),
};

function AIToolsPage() {
  useDocumentHead({
    title,
    description: desc,
    path: '/ai',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'AI & LLM Tools', url: '/ai' },
    ],
    extraJsonLd: collectionJsonLd,
  });

  return (
    <main id="main-content" className="container mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-medium text-primary">AI & LLM Tools</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Browser tools for AI agent developers
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Estimate costs, analyze cache savings, debug streaming responses, and edit JSONL datasets
          without sending your data to Parsify servers.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <a
            key={tool.id}
            href={tool.href}
            className="rounded-xl border bg-card p-5 transition hover:border-primary"
          >
            <h2 className="font-semibold">{tool.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
          </a>
        ))}
      </div>
    </main>
  );
}

export const Route = createFileRoute('/ai/')({
  component: AIToolsPage,
});
