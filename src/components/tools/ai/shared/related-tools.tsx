'use client';

import { toolsData } from '@/data/tools-data';
import type { Tool } from '@/types/tools';

const relatedToolIds: Record<string, string[]> = {
  'token-counter': ['cost-calculator', 'context-visualizer', 'text-chunker'],
  'cost-calculator': ['cache-calculator', 'model-comparison', 'token-counter'],
  'context-visualizer': ['token-counter', 'text-chunker', 'cache-calculator'],
  'prompt-diff': ['prompt-linter', 'token-counter'],
  'prompt-linter': ['prompt-diff', 'token-counter'],
  'schema-generator': ['tool-schema-converter', 'output-validator'],
  'output-validator': ['schema-generator', 'tool-schema-converter'],
  'jsonl-viewer': ['text-chunker', 'output-validator'],
  'sse-parser': ['model-comparison'],
  'model-comparison': ['cost-calculator', 'cache-calculator'],
  'rate-limit-calculator': ['model-comparison', 'api-request-builder'],
  'prompt-format-converter': ['tool-schema-converter', 'api-request-builder', 'prompt-diff'],
  'few-shot-builder': ['prompt-linter', 'prompt-variable-filler', 'token-counter'],
  'prompt-variable-filler': ['few-shot-builder', 'prompt-diff', 'api-request-builder'],
  'schema-builder': ['tool-schema-converter', 'schema-generator', 'output-validator'],
  'finetuning-validator': ['jsonl-viewer', 'token-counter', 'cost-calculator'],
  'embedding-visualizer': ['api-request-builder', 'model-comparison'],
  'api-request-builder': ['prompt-format-converter', 'schema-builder', 'sse-parser'],
  'cache-calculator': ['rate-limit-calculator', 'model-comparison', 'cost-calculator'],
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
