# AI/LLM Tools Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot Parsify.dev from general developer tools to an Astro-based AI/LLM developer tools site with Phase 1 infrastructure and tool routes.

**Architecture:** Keep Astro, React islands, Tailwind, shadcn-style UI primitives, and Cloudflare deployment. Replace the old public tool surface with `/ai/*`, an LLM registry, AI tool metadata, shared AI UI components, and pure utility modules for testable tool logic.

**Tech Stack:** Astro 5, React 19, TypeScript strict mode, Tailwind CSS, existing UI components, Vitest, Biome, Bun.

---

## Implementation Notes

Do not create git commits unless the user explicitly asks. The original writing-plans workflow recommends frequent commits, but this repository instruction forbids committing without explicit user request.

Run verification after implementation:

```bash
bun run lint
bun run typecheck
bun test
```

## File Map

### Create

- `src/data/llm-registry.json`: source of truth for models, pricing, context windows, capabilities, and tokenizer families.
- `src/types/llm.ts`: TypeScript types for registry records and shared AI tool data.
- `src/lib/llm/registry.ts`: typed registry access helpers.
- `src/lib/llm/cost-calculator.ts`: pure cost calculation helpers.
- `src/lib/llm/text-chunker.ts`: pure text chunking helpers.
- `src/lib/llm/sse-parser.ts`: pure SSE parsing helpers.
- `src/lib/llm/tool-schema-converter.ts`: pure schema conversion helpers.
- `src/components/tools/ai/shared/model-selector.tsx`: reusable model selection UI.
- `src/components/tools/ai/shared/token-counter-bar.tsx`: reusable approximate token and cost display.
- `src/components/tools/ai/shared/api-key-input.tsx`: BYOK input component for later tools.
- `src/components/tools/ai/shared/code-export-tabs.tsx`: reusable generated-code tabs.
- `src/components/tools/ai/token-counter.tsx`: Phase 1 token counter tool UI.
- `src/components/tools/ai/cost-calculator.tsx`: Phase 1 cost calculator tool UI.
- `src/components/tools/ai/tool-schema-converter.tsx`: Phase 1 schema converter tool UI.
- `src/components/tools/ai/text-chunker.tsx`: Phase 1 text chunker tool UI.
- `src/components/tools/ai/sse-parser.tsx`: Phase 1 SSE parser tool UI.
- `src/pages/ai/index.astro`: AI tools category page.
- `src/pages/ai/token-counter.astro`: token counter route.
- `src/pages/ai/cost-calculator.astro`: cost calculator route.
- `src/pages/ai/tool-schema-converter.astro`: schema converter route.
- `src/pages/ai/text-chunker.astro`: text chunker route.
- `src/pages/ai/sse-parser.astro`: SSE parser route.
- `src/__tests__/lib/llm/cost-calculator.test.ts`: cost math tests.
- `src/__tests__/lib/llm/text-chunker.test.ts`: chunking tests.
- `src/__tests__/lib/llm/sse-parser.test.ts`: SSE parsing tests.
- `src/__tests__/lib/llm/tool-schema-converter.test.ts`: schema conversion tests.
- `src/__tests__/lib/llm/registry.test.ts`: registry helper tests.

### Modify

- `package.json`: update description to the AI/LLM positioning; no new dependencies are required for the infrastructure pass.
- `src/data/tools-data.ts`: replace old registry entries with AI/LLM tools.
- `src/lib/seo-config.ts`: update default site title/description and category maps for `AI & LLM Tools`.
- `src/pages/index.astro`: point homepage to AI positioning and AI tool registry.
- `src/components/home/hero-section.tsx`: update copy only if existing props are compatible; otherwise keep component behavior and feed new registry data.
- `src/components/layout/*`: remove old category assumptions only where typecheck shows breakage.

### Delete After Replacement

- `src/pages/data-format/`
- `src/pages/security/`
- `src/pages/development/`
- `src/pages/network/`
- old tool-specific files under `src/components/tools/` not used by AI tools
- old tool-specific tests under `src/__tests__/` after their imports are removed

---

### Task 1: Add LLM Types And Registry

**Files:**
- Create: `src/types/llm.ts`
- Create: `src/data/llm-registry.json`
- Create: `src/lib/llm/registry.ts`
- Create: `src/__tests__/lib/llm/registry.test.ts`

- [ ] **Step 1: Write registry helper tests**

Create `src/__tests__/lib/llm/registry.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { getModelById, getModelsByCapability, getModelsByProvider, llmModels } from '@/lib/llm/registry';

describe('llm registry helpers', () => {
  it('loads registry models', () => {
    expect(llmModels.length).toBeGreaterThan(5);
    expect(llmModels.every((model) => model.id.length > 0)).toBe(true);
  });

  it('finds a model by id', () => {
    const model = getModelById('gpt-4o');
    expect(model?.provider).toBe('openai');
    expect(model?.contextWindow).toBeGreaterThan(100000);
  });

  it('filters models by provider', () => {
    const models = getModelsByProvider('anthropic');
    expect(models.length).toBeGreaterThan(0);
    expect(models.every((model) => model.provider === 'anthropic')).toBe(true);
  });

  it('filters models by capability', () => {
    const models = getModelsByCapability('tool_use');
    expect(models.length).toBeGreaterThan(0);
    expect(models.every((model) => model.capabilities.includes('tool_use'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the failing registry test**

Run:

```bash
bun test src/__tests__/lib/llm/registry.test.ts
```

Expected: fail because `@/lib/llm/registry` does not exist.

- [ ] **Step 3: Add LLM types**

Create `src/types/llm.ts`:

```typescript
export type LLMProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'meta'
  | 'deepseek'
  | 'qwen'
  | 'mistral';

export type LLMCapability =
  | 'text'
  | 'vision'
  | 'tool_use'
  | 'prompt_cache'
  | 'batch'
  | 'thinking'
  | 'json_mode'
  | 'embeddings';

export type LLMTokenizer =
  | 'o200k'
  | 'cl100k'
  | 'claude'
  | 'sentencepiece'
  | 'llama'
  | 'qwen'
  | 'mistral';

export interface LLMPricing {
  input: number;
  output: number;
  cacheWrite?: number;
  cacheRead?: number;
  batchInput?: number;
  batchOutput?: number;
}

export interface LLMModel {
  id: string;
  provider: LLMProvider;
  displayName: string;
  contextWindow: number;
  maxOutput: number;
  pricing: LLMPricing;
  capabilities: LLMCapability[];
  tokenizer: LLMTokenizer;
  knowledgeCutoff: string;
}

export interface LLMRegistry {
  version: string;
  lastUpdated: string;
  models: LLMModel[];
}
```

- [ ] **Step 4: Add initial registry data**

Create `src/data/llm-registry.json`:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-04-28",
  "models": [
    {
      "id": "gpt-4o",
      "provider": "openai",
      "displayName": "GPT-4o",
      "contextWindow": 128000,
      "maxOutput": 16384,
      "pricing": { "input": 2.5, "output": 10, "cacheRead": 1.25, "batchInput": 1.25, "batchOutput": 5 },
      "capabilities": ["text", "vision", "tool_use", "json_mode", "batch"],
      "tokenizer": "o200k",
      "knowledgeCutoff": "2023-10"
    },
    {
      "id": "gpt-4o-mini",
      "provider": "openai",
      "displayName": "GPT-4o mini",
      "contextWindow": 128000,
      "maxOutput": 16384,
      "pricing": { "input": 0.15, "output": 0.6, "cacheRead": 0.075, "batchInput": 0.075, "batchOutput": 0.3 },
      "capabilities": ["text", "vision", "tool_use", "json_mode", "batch"],
      "tokenizer": "o200k",
      "knowledgeCutoff": "2023-10"
    },
    {
      "id": "claude-3-5-sonnet",
      "provider": "anthropic",
      "displayName": "Claude 3.5 Sonnet",
      "contextWindow": 200000,
      "maxOutput": 8192,
      "pricing": { "input": 3, "output": 15, "cacheWrite": 3.75, "cacheRead": 0.3 },
      "capabilities": ["text", "vision", "tool_use", "prompt_cache", "batch"],
      "tokenizer": "claude",
      "knowledgeCutoff": "2024-04"
    },
    {
      "id": "claude-3-5-haiku",
      "provider": "anthropic",
      "displayName": "Claude 3.5 Haiku",
      "contextWindow": 200000,
      "maxOutput": 8192,
      "pricing": { "input": 0.8, "output": 4, "cacheWrite": 1, "cacheRead": 0.08 },
      "capabilities": ["text", "vision", "tool_use", "prompt_cache", "batch"],
      "tokenizer": "claude",
      "knowledgeCutoff": "2024-07"
    },
    {
      "id": "gemini-2-5-pro",
      "provider": "google",
      "displayName": "Gemini 2.5 Pro",
      "contextWindow": 1000000,
      "maxOutput": 65536,
      "pricing": { "input": 1.25, "output": 10 },
      "capabilities": ["text", "vision", "tool_use", "thinking"],
      "tokenizer": "sentencepiece",
      "knowledgeCutoff": "2025-01"
    },
    {
      "id": "llama-3-1-70b",
      "provider": "meta",
      "displayName": "Llama 3.1 70B",
      "contextWindow": 128000,
      "maxOutput": 8192,
      "pricing": { "input": 0.88, "output": 0.88 },
      "capabilities": ["text", "tool_use"],
      "tokenizer": "llama",
      "knowledgeCutoff": "2023-12"
    },
    {
      "id": "deepseek-v3",
      "provider": "deepseek",
      "displayName": "DeepSeek V3",
      "contextWindow": 64000,
      "maxOutput": 8192,
      "pricing": { "input": 0.27, "output": 1.1 },
      "capabilities": ["text", "tool_use", "json_mode"],
      "tokenizer": "qwen",
      "knowledgeCutoff": "2024-07"
    },
    {
      "id": "qwen-2-5-72b",
      "provider": "qwen",
      "displayName": "Qwen 2.5 72B",
      "contextWindow": 128000,
      "maxOutput": 8192,
      "pricing": { "input": 0.8, "output": 2.4 },
      "capabilities": ["text", "tool_use", "json_mode"],
      "tokenizer": "qwen",
      "knowledgeCutoff": "2024-09"
    },
    {
      "id": "mistral-large",
      "provider": "mistral",
      "displayName": "Mistral Large",
      "contextWindow": 128000,
      "maxOutput": 8192,
      "pricing": { "input": 2, "output": 6 },
      "capabilities": ["text", "tool_use", "json_mode"],
      "tokenizer": "mistral",
      "knowledgeCutoff": "2024-11"
    }
  ]
}
```

- [ ] **Step 5: Add registry helper**

Create `src/lib/llm/registry.ts`:

```typescript
import registry from '@/data/llm-registry.json';
import type { LLMCapability, LLMModel, LLMProvider, LLMRegistry } from '@/types/llm';

const typedRegistry = registry as LLMRegistry;

export const llmRegistry = typedRegistry;
export const llmModels = typedRegistry.models;

export function getModelById(id: string): LLMModel | undefined {
  return llmModels.find((model) => model.id === id);
}

export function getModelsByProvider(provider: LLMProvider): LLMModel[] {
  return llmModels.filter((model) => model.provider === provider);
}

export function getModelsByCapability(capability: LLMCapability): LLMModel[] {
  return llmModels.filter((model) => model.capabilities.includes(capability));
}
```

- [ ] **Step 6: Run registry test**

Run:

```bash
bun test src/__tests__/lib/llm/registry.test.ts
```

Expected: pass.

---

### Task 2: Replace Tool Registry With AI/LLM Tools

**Files:**
- Modify: `src/data/tools-data.ts`
- Modify: `src/lib/seo-config.ts`

- [ ] **Step 1: Replace `src/data/tools-data.ts` contents**

Use the existing `Tool` interface. Replace all old entries with AI/LLM entries and one category export.

```typescript
import type { Tool, ToolCategoryData } from '@/types/tools';

export const AI_TOOLS_CATEGORY = 'AI & LLM Tools';

export const toolsData: Tool[] = [
  {
    id: 'token-counter',
    name: 'Multi-Model Token Counter',
    description:
      'Compare token counts across OpenAI, Claude, Gemini, Llama, DeepSeek, Qwen, and Mistral models directly in your browser.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Tokens & Cost',
    icon: 'Gauge',
    features: ['Multi-model comparison', 'Approximate token counts', 'Context usage', 'JSON export'],
    tags: ['token-counter', 'llm', 'gpt', 'claude', 'gemini', 'tokens'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/ai/token-counter',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'cost-calculator',
    name: 'LLM Cost Calculator',
    description:
      'Estimate monthly LLM API costs across providers using request volume, token usage, cache assumptions, and batch pricing.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Tokens & Cost',
    icon: 'Calculator',
    features: ['Monthly estimates', 'Provider comparison', 'Cache assumptions', 'Batch pricing'],
    tags: ['llm-cost', 'pricing', 'openai', 'anthropic', 'calculator'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/ai/cost-calculator',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'tool-schema-converter',
    name: 'Tool Schema Converter',
    description:
      'Convert tool and function-calling schemas between OpenAI, Anthropic, Gemini, and MCP formats.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Tool Calling',
    icon: 'ArrowsClockwise',
    features: ['OpenAI functions', 'Anthropic tools', 'Gemini functions', 'MCP tools'],
    tags: ['function-calling', 'tool-use', 'schema', 'mcp', 'openai', 'anthropic'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/ai/tool-schema-converter',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'text-chunker',
    name: 'Token-Aware Text Chunker',
    description:
      'Split long text into RAG-ready chunks with configurable chunk size, overlap, token estimates, and JSONL export.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'RAG & Data',
    icon: 'Stack',
    features: ['Chunk size controls', 'Overlap controls', 'Chunk metadata', 'JSONL export'],
    tags: ['rag', 'chunking', 'text-splitter', 'jsonl', 'embeddings'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/ai/text-chunker',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'sse-parser',
    name: 'LLM SSE Stream Parser',
    description:
      'Parse raw OpenAI, Anthropic, and Gemini streaming responses into events, deltas, tool calls, usage, and errors.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'API Debugging',
    icon: 'Activity',
    features: ['SSE event parsing', 'Delta reconstruction', 'Usage extraction', 'Error highlighting'],
    tags: ['sse', 'streaming', 'llm-debugging', 'openai', 'anthropic', 'gemini'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/ai/sse-parser',
    processingType: 'client-side',
    security: 'local-only',
  },
];

export const toolCategories: ToolCategoryData[] = [
  {
    id: 'ai',
    name: AI_TOOLS_CATEGORY,
    description: 'Privacy-first browser tools for AI agent and LLM application developers.',
    subcategories: [
      { id: 'tokens-cost', name: 'Tokens & Cost' },
      { id: 'tool-calling', name: 'Tool Calling' },
      { id: 'rag-data', name: 'RAG & Data' },
      { id: 'api-debugging', name: 'API Debugging' },
    ],
  },
];
```

- [ ] **Step 2: Update SEO defaults**

Open `src/lib/seo-config.ts`. Replace default title and description with AI positioning and ensure category maps include only the AI category:

```typescript
export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'AI & LLM Tools': 'ai',
};

export const CATEGORY_NAME_MAP: Record<string, string> = {
  ai: 'AI & LLM Tools',
};
```

Keep any unrelated exported helpers intact.

- [ ] **Step 3: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: may fail because old pages still import old tools. Fix in later cleanup tasks if failures reference routes that will be deleted.

---

### Task 3: Add Pure LLM Utility Modules

**Files:**
- Create: `src/lib/llm/cost-calculator.ts`
- Create: `src/lib/llm/text-chunker.ts`
- Create: `src/lib/llm/sse-parser.ts`
- Create: `src/lib/llm/tool-schema-converter.ts`
- Create tests under `src/__tests__/lib/llm/`

- [ ] **Step 1: Add cost calculator test**

Create `src/__tests__/lib/llm/cost-calculator.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { calculateMonthlyCost } from '@/lib/llm/cost-calculator';

describe('calculateMonthlyCost', () => {
  it('calculates standard input and output cost', () => {
    const result = calculateMonthlyCost({
      monthlyRequests: 1000,
      inputTokensPerRequest: 1000,
      outputTokensPerRequest: 500,
      inputPricePerMillion: 3,
      outputPricePerMillion: 15,
      cacheHitRate: 0,
      useBatch: false,
    });

    expect(result.inputCost).toBe(3);
    expect(result.outputCost).toBe(7.5);
    expect(result.totalCost).toBe(10.5);
  });
});
```

- [ ] **Step 2: Add cost calculator implementation**

Create `src/lib/llm/cost-calculator.ts`:

```typescript
export interface CostCalculationInput {
  monthlyRequests: number;
  inputTokensPerRequest: number;
  outputTokensPerRequest: number;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  cacheReadPricePerMillion?: number;
  cacheHitRate: number;
  useBatch: boolean;
  batchInputPricePerMillion?: number;
  batchOutputPricePerMillion?: number;
}

export interface CostCalculationResult {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  monthlyInputTokens: number;
  monthlyOutputTokens: number;
}

export function calculateMonthlyCost(input: CostCalculationInput): CostCalculationResult {
  const monthlyInputTokens = input.monthlyRequests * input.inputTokensPerRequest;
  const monthlyOutputTokens = input.monthlyRequests * input.outputTokensPerRequest;
  const inputPrice = input.useBatch
    ? (input.batchInputPricePerMillion ?? input.inputPricePerMillion)
    : input.inputPricePerMillion;
  const outputPrice = input.useBatch
    ? (input.batchOutputPricePerMillion ?? input.outputPricePerMillion)
    : input.outputPricePerMillion;
  const cacheHitRate = Math.min(Math.max(input.cacheHitRate, 0), 1);
  const cacheReadPrice = input.cacheReadPricePerMillion ?? inputPrice;
  const cachedTokens = monthlyInputTokens * cacheHitRate;
  const uncachedTokens = monthlyInputTokens - cachedTokens;
  const inputCost = (uncachedTokens / 1_000_000) * inputPrice + (cachedTokens / 1_000_000) * cacheReadPrice;
  const outputCost = (monthlyOutputTokens / 1_000_000) * outputPrice;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    monthlyInputTokens,
    monthlyOutputTokens,
  };
}
```

- [ ] **Step 3: Add text chunker test**

Create `src/__tests__/lib/llm/text-chunker.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { chunkText } from '@/lib/llm/text-chunker';

describe('chunkText', () => {
  it('splits text into overlapping chunks', () => {
    const chunks = chunkText('abcdefghijklmnopqrstuvwxyz', { chunkSize: 10, overlap: 2 });

    expect(chunks).toHaveLength(3);
    expect(chunks[0]?.text).toBe('abcdefghij');
    expect(chunks[1]?.text).toBe('ijklmnopqr');
    expect(chunks[1]?.startOffset).toBe(8);
  });
});
```

- [ ] **Step 4: Add text chunker implementation**

Create `src/lib/llm/text-chunker.ts`:

```typescript
export interface ChunkTextOptions {
  chunkSize: number;
  overlap: number;
}

export interface TextChunk {
  chunkId: string;
  text: string;
  startOffset: number;
  endOffset: number;
  estimatedTokens: number;
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function chunkText(text: string, options: ChunkTextOptions): TextChunk[] {
  const chunkSize = Math.max(1, options.chunkSize);
  const overlap = Math.min(Math.max(0, options.overlap), chunkSize - 1);
  const step = chunkSize - overlap;
  const chunks: TextChunk[] = [];

  for (let start = 0; start < text.length; start += step) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push({
      chunkId: `chunk_${String(chunks.length + 1).padStart(4, '0')}`,
      text: chunk,
      startOffset: start,
      endOffset: end,
      estimatedTokens: estimateTokens(chunk),
    });

    if (end === text.length) break;
  }

  return chunks;
}
```

- [ ] **Step 5: Add SSE parser test and implementation**

Create `src/__tests__/lib/llm/sse-parser.test.ts` and `src/lib/llm/sse-parser.ts` with this behavior:

```typescript
// test
import { describe, expect, it } from 'vitest';
import { parseSSEStream } from '@/lib/llm/sse-parser';

describe('parseSSEStream', () => {
  it('parses data events and skips done marker', () => {
    const result = parseSSEStream('event: message\ndata: {"delta":"hi"}\n\ndata: [DONE]\n\n');

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.event).toBe('message');
    expect(result.events[0]?.json).toEqual({ delta: 'hi' });
  });
});
```

```typescript
// implementation
export interface ParsedSSEEvent {
  id?: string;
  event?: string;
  data: string;
  json?: unknown;
  index: number;
}

export interface ParsedSSEStream {
  events: ParsedSSEEvent[];
  errors: string[];
}

export function parseSSEStream(input: string): ParsedSSEStream {
  const blocks = input.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const errors: string[] = [];
  const events = blocks.flatMap((block, index): ParsedSSEEvent[] => {
    const lines = block.split('\n');
    let id: string | undefined;
    let event: string | undefined;
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('id:')) id = line.slice(3).trim();
      if (line.startsWith('event:')) event = line.slice(6).trim();
      if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }

    const data = dataLines.join('\n');
    if (!data || data === '[DONE]') return [];

    try {
      return [{ id, event, data, json: JSON.parse(data), index }];
    } catch {
      errors.push(`Event ${index + 1} contains non-JSON data.`);
      return [{ id, event, data, index }];
    }
  });

  return { events, errors };
}
```

- [ ] **Step 6: Add tool schema converter test and implementation**

Create `src/__tests__/lib/llm/tool-schema-converter.test.ts` and `src/lib/llm/tool-schema-converter.ts` with this minimal provider-neutral conversion:

```typescript
// test
import { describe, expect, it } from 'vitest';
import { convertToolSchema } from '@/lib/llm/tool-schema-converter';

describe('convertToolSchema', () => {
  it('converts a neutral schema into provider formats', () => {
    const result = convertToolSchema({
      name: 'search_web',
      description: 'Search the web.',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search query' } },
        required: ['query'],
      },
    });

    expect(result.openai.function.name).toBe('search_web');
    expect(result.anthropic.input_schema.required).toEqual(['query']);
    expect(result.gemini.functionDeclarations[0]?.parameters.required).toEqual(['query']);
    expect(result.mcp.inputSchema.required).toEqual(['query']);
  });
});
```

```typescript
// implementation
export interface NeutralToolSchema {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export function convertToolSchema(tool: NeutralToolSchema) {
  return {
    openai: {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    },
    anthropic: {
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    },
    gemini: {
      functionDeclarations: [
        {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      ],
    },
    mcp: {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: {},
    },
  };
}
```

- [ ] **Step 7: Run all LLM utility tests**

Run:

```bash
bun test src/__tests__/lib/llm
```

Expected: pass.

---

### Task 4: Add Shared AI Components

**Files:**
- Create: `src/components/tools/ai/shared/model-selector.tsx`
- Create: `src/components/tools/ai/shared/token-counter-bar.tsx`
- Create: `src/components/tools/ai/shared/api-key-input.tsx`
- Create: `src/components/tools/ai/shared/code-export-tabs.tsx`

- [ ] **Step 1: Create `ModelSelector`**

Use `Select`, `Label`, and registry models. Keep single-select for Phase 1 to avoid unnecessary complexity.

```typescript
'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { llmModels } from '@/lib/llm/registry';

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
}

export function ModelSelector({ value, onValueChange, label = 'Model' }: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {llmModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 2: Create `TokenCounterBar`**

```typescript
'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getModelById } from '@/lib/llm/registry';
import { estimateTokens } from '@/lib/llm/text-chunker';

interface TokenCounterBarProps {
  text: string;
  modelId: string;
}

export function TokenCounterBar({ text, modelId }: TokenCounterBarProps) {
  const model = getModelById(modelId);
  const tokens = text.trim().length === 0 ? 0 : estimateTokens(text);
  const contextWindow = model?.contextWindow ?? 1;
  const usage = Math.min(100, (tokens / contextWindow) * 100);

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">Estimated tokens</span>
        <Badge variant="secondary">{tokens.toLocaleString()} tokens</Badge>
      </div>
      <Progress value={usage} />
      <p className="text-xs text-muted-foreground">
        {model ? `${model.displayName} context usage: ${usage.toFixed(2)}%` : 'Select a model'}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create `APIKeyInput`**

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PrivacyNotice } from '@/components/ui/privacy-notice';

interface APIKeyInputProps {
  provider: string;
  value: string;
  onValueChange: (value: string) => void;
}

export function APIKeyInput({ provider, value, onValueChange }: APIKeyInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <PrivacyNotice />
      <div className="space-y-2">
        <Label>{provider} API key</Label>
        <div className="flex gap-2">
          <Input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Key stays in your browser"
          />
          <Button type="button" variant="outline" onClick={() => setVisible((current) => !current)}>
            {visible ? 'Hide' : 'Show'}
          </Button>
          <Button type="button" variant="outline" onClick={() => onValueChange('')}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `CodeExportTabs`**

```typescript
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CodeExportTabsProps {
  examples: Record<string, string>;
}

export function CodeExportTabs({ examples }: CodeExportTabsProps) {
  const entries = Object.entries(examples);
  const defaultValue = entries[0]?.[0] ?? 'text';

  return (
    <Tabs defaultValue={defaultValue}>
      <TabsList>
        {entries.map(([name]) => (
          <TabsTrigger key={name} value={name}>
            {name}
          </TabsTrigger>
        ))}
      </TabsList>
      {entries.map(([name, code]) => (
        <TabsContent key={name} value={name}>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
            <code>{code}</code>
          </pre>
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

- [ ] **Step 5: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: shared components typecheck, except failures from old routes pending deletion are acceptable until Task 7.

---

### Task 5: Add Phase 1 Tool Components

**Files:**
- Create: `src/components/tools/ai/token-counter.tsx`
- Create: `src/components/tools/ai/cost-calculator.tsx`
- Create: `src/components/tools/ai/tool-schema-converter.tsx`
- Create: `src/components/tools/ai/text-chunker.tsx`
- Create: `src/components/tools/ai/sse-parser.tsx`

- [ ] **Step 1: Create token counter UI**

Create `src/components/tools/ai/token-counter.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ModelSelector } from '@/components/tools/ai/shared/model-selector';
import { TokenCounterBar } from '@/components/tools/ai/shared/token-counter-bar';

export default function TokenCounter() {
  const [text, setText] = useState('Paste your prompt, messages, or RAG context here.');
  const [modelId, setModelId] = useState('gpt-4o');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Multi-Model Token Counter</CardTitle>
          <CardDescription>
            Estimate token usage locally before sending prompts to an LLM provider.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ModelSelector value={modelId} onValueChange={setModelId} />
          <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={12} />
          <TokenCounterBar text={text} modelId={modelId} />
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create cost calculator UI**

Create `src/components/tools/ai/cost-calculator.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { calculateMonthlyCost } from '@/lib/llm/cost-calculator';
import { getModelById } from '@/lib/llm/registry';
import { ModelSelector } from '@/components/tools/ai/shared/model-selector';

export default function CostCalculator() {
  const [modelId, setModelId] = useState('gpt-4o');
  const [monthlyRequests, setMonthlyRequests] = useState(100000);
  const [inputTokens, setInputTokens] = useState(1000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [cacheHitRate, setCacheHitRate] = useState(0);
  const [useBatch, setUseBatch] = useState(false);
  const model = getModelById(modelId);
  const result = model
    ? calculateMonthlyCost({
        monthlyRequests,
        inputTokensPerRequest: inputTokens,
        outputTokensPerRequest: outputTokens,
        inputPricePerMillion: model.pricing.input,
        outputPricePerMillion: model.pricing.output,
        cacheReadPricePerMillion: model.pricing.cacheRead,
        cacheHitRate: cacheHitRate / 100,
        useBatch,
        batchInputPricePerMillion: model.pricing.batchInput,
        batchOutputPricePerMillion: model.pricing.batchOutput,
      })
    : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM Cost Calculator</CardTitle>
        <CardDescription>Compare estimated monthly API spend using local calculations.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <ModelSelector value={modelId} onValueChange={setModelId} />
        <label className="space-y-2">
          <Label>Monthly requests</Label>
          <Input type="number" value={monthlyRequests} onChange={(event) => setMonthlyRequests(Number(event.target.value))} />
        </label>
        <label className="space-y-2">
          <Label>Average input tokens</Label>
          <Input type="number" value={inputTokens} onChange={(event) => setInputTokens(Number(event.target.value))} />
        </label>
        <label className="space-y-2">
          <Label>Average output tokens</Label>
          <Input type="number" value={outputTokens} onChange={(event) => setOutputTokens(Number(event.target.value))} />
        </label>
        <label className="space-y-2">
          <Label>Cache hit rate (%)</Label>
          <Input type="number" value={cacheHitRate} onChange={(event) => setCacheHitRate(Number(event.target.value))} />
        </label>
        <div className="flex items-center gap-3">
          <Switch checked={useBatch} onCheckedChange={setUseBatch} />
          <Label>Use batch pricing when available</Label>
        </div>
        <div className="rounded-lg border p-4 lg:col-span-2">
          <p className="text-sm text-muted-foreground">Estimated monthly cost</p>
          <p className="text-3xl font-semibold">${(result?.totalCost ?? 0).toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create tool schema converter UI**

Create `src/components/tools/ai/tool-schema-converter.tsx`:

```typescript
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CodeExportTabs } from '@/components/tools/ai/shared/code-export-tabs';
import { convertToolSchema, type NeutralToolSchema } from '@/lib/llm/tool-schema-converter';

const sample = JSON.stringify(
  {
    name: 'search_web',
    description: 'Search the web.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search query' } },
      required: ['query'],
    },
  },
  null,
  2,
);

export default function ToolSchemaConverter() {
  const [input, setInput] = useState(sample);
  const output = useMemo(() => {
    try {
      const converted = convertToolSchema(JSON.parse(input) as NeutralToolSchema);
      return Object.fromEntries(Object.entries(converted).map(([key, value]) => [key, JSON.stringify(value, null, 2)]));
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Invalid JSON' };
    }
  }, [input]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Schema Converter</CardTitle>
        <CardDescription>Convert one neutral tool definition into provider-specific formats.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={18} />
        <CodeExportTabs examples={output} />
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create text chunker UI**

Create `src/components/tools/ai/text-chunker.tsx`:

```typescript
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { chunkText } from '@/lib/llm/text-chunker';

export default function TextChunker() {
  const [text, setText] = useState('Paste a long document here to split it into RAG-ready chunks.');
  const [chunkSize, setChunkSize] = useState(800);
  const [overlap, setOverlap] = useState(120);
  const chunks = useMemo(() => chunkText(text, { chunkSize, overlap }), [text, chunkSize, overlap]);
  const jsonl = chunks.map((chunk) => JSON.stringify(chunk)).join('\n');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token-Aware Text Chunker</CardTitle>
        <CardDescription>Split local text into chunks with offsets and estimated token counts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <Label>Chunk size</Label>
            <Input type="number" value={chunkSize} onChange={(event) => setChunkSize(Number(event.target.value))} />
          </label>
          <label className="space-y-2">
            <Label>Overlap</Label>
            <Input type="number" value={overlap} onChange={(event) => setOverlap(Number(event.target.value))} />
          </label>
        </div>
        <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={10} />
        <p className="text-sm text-muted-foreground">Generated {chunks.length} chunks.</p>
        <Textarea value={jsonl} readOnly rows={10} />
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Create SSE parser UI**

Create `src/components/tools/ai/sse-parser.tsx`:

```typescript
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { parseSSEStream } from '@/lib/llm/sse-parser';

const sample = 'event: message\ndata: {"delta":"Hello"}\n\ndata: {"delta":" world"}\n\ndata: [DONE]\n\n';

export default function SSEParser() {
  const [input, setInput] = useState(sample);
  const parsed = useMemo(() => parseSSEStream(input), [input]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM SSE Stream Parser</CardTitle>
        <CardDescription>Inspect raw streaming logs without sending them to a server.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={18} />
        <div className="space-y-3">
          {parsed.errors.map((error) => (
            <div key={error} className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">
              {error}
            </div>
          ))}
          {parsed.events.map((event) => (
            <pre key={event.index} className="overflow-auto rounded-lg bg-muted p-3 text-xs">
              {JSON.stringify(event, null, 2)}
            </pre>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 6: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: new components compile, old-route failures remain until cleanup.

---

### Task 6: Add `/ai/*` Astro Routes

**Files:**
- Create: `src/pages/ai/index.astro`
- Create: `src/pages/ai/token-counter.astro`
- Create: `src/pages/ai/cost-calculator.astro`
- Create: `src/pages/ai/tool-schema-converter.astro`
- Create: `src/pages/ai/text-chunker.astro`
- Create: `src/pages/ai/sse-parser.astro`

- [ ] **Step 1: Add AI category page**

Create `src/pages/ai/index.astro`:

```astro
---
import Layout from '../../layouts/BaseLayout.astro';
import { SEO_CONFIG } from '../../lib/seo-config';
import { toolsData, AI_TOOLS_CATEGORY } from '../../data/tools-data';

const tools = toolsData.filter((tool) => tool.category === AI_TOOLS_CATEGORY);
const title = 'AI & LLM Developer Tools | Parsify.dev';
const desc = 'Privacy-first browser tools for AI agent and LLM application developers.';
---

<Layout>
  <slot name="head">
    <title>{title}</title>
    <meta name="description" content={desc} />
    <link rel="canonical" href={`${SEO_CONFIG.BASE_URL}/ai`} />
  </slot>
  <main id="main-content" class="container mx-auto max-w-7xl px-6 py-12 lg:px-8">
    <div class="mb-10 max-w-3xl">
      <p class="text-sm font-medium text-primary">AI & LLM Tools</p>
      <h1 class="mt-3 text-4xl font-bold tracking-tight">Browser tools for AI agent developers</h1>
      <p class="mt-4 text-lg text-muted-foreground">Count tokens, estimate costs, convert tool schemas, chunk RAG data, and debug streaming responses without sending your data to Parsify servers.</p>
    </div>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <a href={tool.href} class="rounded-xl border bg-card p-5 transition hover:border-primary">
          <h2 class="font-semibold">{tool.name}</h2>
          <p class="mt-2 text-sm text-muted-foreground">{tool.description}</p>
        </a>
      ))}
    </div>
  </main>
</Layout>
```

- [ ] **Step 2: Add token counter route**

Create `src/pages/ai/token-counter.astro`:

```astro
---
import Layout from '../../layouts/BaseLayout.astro';
import TokenCounter from '../../components/tools/ai/token-counter';
import { SEO_CONFIG } from '../../lib/seo-config';
const title = 'Multi-Model Token Counter | Parsify.dev';
const desc = 'Compare estimated LLM token usage locally across major model providers.';
---
<Layout>
  <slot name="head"><title>{title}</title><meta name="description" content={desc} /><link rel="canonical" href={`${SEO_CONFIG.BASE_URL}/ai/token-counter`} /></slot>
  <main id="main-content" class="container mx-auto max-w-7xl px-6 py-8 lg:px-8"><TokenCounter client:load /></main>
</Layout>
```

- [ ] **Step 3: Add cost calculator route**

Create `src/pages/ai/cost-calculator.astro`:

```astro
---
import Layout from '../../layouts/BaseLayout.astro';
import CostCalculator from '../../components/tools/ai/cost-calculator';
import { SEO_CONFIG } from '../../lib/seo-config';
const title = 'LLM Cost Calculator | Parsify.dev';
const desc = 'Estimate monthly LLM API costs locally across providers.';
---
<Layout>
  <slot name="head"><title>{title}</title><meta name="description" content={desc} /><link rel="canonical" href={`${SEO_CONFIG.BASE_URL}/ai/cost-calculator`} /></slot>
  <main id="main-content" class="container mx-auto max-w-7xl px-6 py-8 lg:px-8"><CostCalculator client:load /></main>
</Layout>
```

- [ ] **Step 4: Add schema converter route**

Create `src/pages/ai/tool-schema-converter.astro`:

```astro
---
import Layout from '../../layouts/BaseLayout.astro';
import ToolSchemaConverter from '../../components/tools/ai/tool-schema-converter';
import { SEO_CONFIG } from '../../lib/seo-config';
const title = 'Tool Schema Converter | Parsify.dev';
const desc = 'Convert function-calling schemas between OpenAI, Anthropic, Gemini, and MCP formats.';
---
<Layout>
  <slot name="head"><title>{title}</title><meta name="description" content={desc} /><link rel="canonical" href={`${SEO_CONFIG.BASE_URL}/ai/tool-schema-converter`} /></slot>
  <main id="main-content" class="container mx-auto max-w-7xl px-6 py-8 lg:px-8"><ToolSchemaConverter client:load /></main>
</Layout>
```

- [ ] **Step 5: Add text chunker route**

Create `src/pages/ai/text-chunker.astro`:

```astro
---
import Layout from '../../layouts/BaseLayout.astro';
import TextChunker from '../../components/tools/ai/text-chunker';
import { SEO_CONFIG } from '../../lib/seo-config';
const title = 'Token-Aware Text Chunker | Parsify.dev';
const desc = 'Split text into RAG-ready chunks with offsets and token estimates in your browser.';
---
<Layout>
  <slot name="head"><title>{title}</title><meta name="description" content={desc} /><link rel="canonical" href={`${SEO_CONFIG.BASE_URL}/ai/text-chunker`} /></slot>
  <main id="main-content" class="container mx-auto max-w-7xl px-6 py-8 lg:px-8"><TextChunker client:load /></main>
</Layout>
```

- [ ] **Step 6: Add SSE parser route**

Create `src/pages/ai/sse-parser.astro`:

```astro
---
import Layout from '../../layouts/BaseLayout.astro';
import SSEParser from '../../components/tools/ai/sse-parser';
import { SEO_CONFIG } from '../../lib/seo-config';
const title = 'LLM SSE Stream Parser | Parsify.dev';
const desc = 'Parse and inspect raw LLM streaming responses locally.';
---
<Layout>
  <slot name="head"><title>{title}</title><meta name="description" content={desc} /><link rel="canonical" href={`${SEO_CONFIG.BASE_URL}/ai/sse-parser`} /></slot>
  <main id="main-content" class="container mx-auto max-w-7xl px-6 py-8 lg:px-8"><SSEParser client:load /></main>
</Layout>
```

- [ ] **Step 7: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: `/ai/*` routes compile.

---

### Task 7: Reposition Home Page And Remove Old Public Routes

**Files:**
- Modify: `src/pages/index.astro`
- Delete: `src/pages/data-format/`
- Delete: `src/pages/security/`
- Delete: `src/pages/development/`
- Delete: `src/pages/network/`
- Delete old unused files under `src/components/tools/` after verifying no references remain.

- [ ] **Step 1: Update homepage metadata**

Update `src/pages/index.astro` to use AI-focused title and description from `SEO_CONFIG`.

- [ ] **Step 2: Delete old route directories**

Delete the four old public route directories.

- [ ] **Step 3: Search for stale old route references**

Run content searches for old route prefixes:

```bash
bunx rg "/data-format|/security|/development|/network" src
```

Expected: no references, except intentional comments if any. Remove stale references.

- [ ] **Step 4: Search for stale old category names**

Run:

```bash
bunx rg "Data Format|Security & Authentication|Development & Testing|Network & Utility" src
```

Expected: no references. Remove stale references.

- [ ] **Step 5: Delete old tool components only when unreferenced**

Run searches for imports from old tool folders before deletion. Delete old `src/components/tools/*` subfolders that are not `ai/` only after imports are gone.

- [ ] **Step 6: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: pass or show only old tests/libs to clean in Task 8.

---

### Task 8: Remove Old Tests And Unused Tool Libraries

**Files:**
- Delete old tests under `src/__tests__/` that import deleted tool libraries.
- Delete old tool-specific libraries only when typecheck and searches prove they are unused.

- [ ] **Step 1: Run tests to identify stale imports**

Run:

```bash
bun test
```

Expected: stale tests may fail if they import deleted old libraries.

- [ ] **Step 2: Delete stale old tests**

Delete tests that only cover removed general developer tools. Keep tests for generic utilities that remain used by the AI site.

- [ ] **Step 3: Search for old library imports**

Run:

```bash
bunx rg "@/lib/(crypto|json|html|security)|@/components/tools/(code|json|text|security|network|generators|converters|utilities|image|data|workbench)" src
```

Expected: no references after cleanup. Delete unused old directories only after no references remain.

- [ ] **Step 4: Run tests again**

Run:

```bash
bun test
```

Expected: new LLM tests pass.

---

### Task 9: Final Verification

**Files:**
- No specific file changes unless verification reveals issues.

- [ ] **Step 1: Run lint**

Run:

```bash
bun run lint
```

Expected: pass.

- [ ] **Step 2: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: pass.

- [ ] **Step 3: Run tests**

Run:

```bash
bun test
```

Expected: pass.

- [ ] **Step 4: Build**

Run:

```bash
bun run build
```

Expected: Astro build succeeds.

## Self-Review

Spec coverage:

- Astro `/ai/*` architecture: covered by Task 6.
- Old tool removal: covered by Tasks 7 and 8.
- LLM registry: covered by Task 1.
- Tool registry rewrite: covered by Task 2.
- Shared AI components: covered by Task 4.
- Phase 1 tool pages: covered by Tasks 5 and 6.
- Pure browser-side logic: covered by Task 3 and UI tasks that call local helpers.
- Verification: covered by Task 9.

Known implementation constraint:

- This plan intentionally avoids adding tokenizer dependencies in the infrastructure pass. Token counting starts with an approximate estimator, and tokenizer WASM integration should be a follow-up plan.
