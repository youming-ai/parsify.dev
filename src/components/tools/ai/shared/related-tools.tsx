'use client';

import { toolsData } from '@/data/tools-data';
import type { Tool } from '@/types/tools';

const relatedToolIds: Record<string, string[]> = {
  'token-counter': ['cost-calculator', 'cache-calculator', 'rate-limit-calculator'],
  'cost-calculator': ['cache-calculator', 'rate-limit-calculator', 'token-counter'],
  'cache-calculator': ['cost-calculator', 'rate-limit-calculator', 'token-counter'],
  'rate-limit-calculator': ['cost-calculator', 'cache-calculator', 'token-counter'],
  'sse-parser': ['tool-schema-converter', 'jsonl-viewer'],
  'tool-schema-converter': ['sse-parser', 'jsonl-viewer'],
  'jsonl-viewer': ['tool-schema-converter', 'token-counter', 'sse-parser'],
};

interface RelatedToolsProps {
  toolId: string;
}

export function RelatedTools({ toolId }: RelatedToolsProps) {
  const tools = (relatedToolIds[toolId] ?? [])
    .map((id) => toolsData.find((tool) => tool.id === id))
    .filter((tool): tool is Tool => tool !== undefined);

  if (tools.length === 0) return null;

  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Related tools</h2>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {tools.map((tool) => (
          <a
            key={tool.id}
            href={tool.href}
            className="rounded-md border p-3 text-sm hover:border-primary"
          >
            <span className="font-medium">{tool.name}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
