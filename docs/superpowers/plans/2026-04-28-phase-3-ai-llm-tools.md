# Phase 3 AI/LLM Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the eight Phase 3 AI/LLM tools while keeping the site browser-first and excluding A4 Provider Status.

**Architecture:** Extend the existing Astro + React island implementation. Pure logic remains in `src/lib/llm/`, React tool UIs live in `src/components/tools/ai/`, Astro routes live in `src/pages/ai/`, and shared UI stays under `src/components/tools/ai/shared/`.

**Tech Stack:** Astro 5, React 19, TypeScript strict mode, Tailwind CSS, existing UI components, Vitest, Biome, Bun.

---

## Implementation Notes

Do not create git commits unless the user explicitly asks.

Do not add backend services or scheduled jobs. A4 Provider Status is out of scope.

No tests should call live provider APIs. BYOK-related tests validate request construction only.

All tool components use named exports and Astro route aliases:

```astro
import { RateLimitCalculator as RateLimitCalculatorTool } from '../../components/tools/ai/rate-limit-calculator';

<RateLimitCalculatorTool client:load />
```

## File Map

### Create

- `src/lib/llm/rate-limit-calculator.ts`
- `src/lib/llm/prompt-format-converter.ts`
- `src/lib/llm/few-shot-builder.ts`
- `src/lib/llm/prompt-variable-filler.ts`
- `src/lib/llm/schema-builder.ts`
- `src/lib/llm/finetuning-validator.ts`
- `src/lib/llm/embedding-visualizer.ts`
- `src/lib/llm/api-request-builder.ts`
- `src/lib/llm/provider-client.ts`
- `src/components/tools/ai/rate-limit-calculator.tsx`
- `src/components/tools/ai/prompt-format-converter.tsx`
- `src/components/tools/ai/few-shot-builder.tsx`
- `src/components/tools/ai/prompt-variable-filler.tsx`
- `src/components/tools/ai/schema-builder.tsx`
- `src/components/tools/ai/finetuning-validator.tsx`
- `src/components/tools/ai/embedding-visualizer.tsx`
- `src/components/tools/ai/api-request-builder.tsx`
- `src/components/tools/ai/shared/provider-selector.tsx`
- `src/components/tools/ai/shared/byok-notice.tsx`
- `src/pages/ai/rate-limit-calculator.astro`
- `src/pages/ai/prompt-format-converter.astro`
- `src/pages/ai/few-shot-builder.astro`
- `src/pages/ai/prompt-variable-filler.astro`
- `src/pages/ai/schema-builder.astro`
- `src/pages/ai/finetuning-validator.astro`
- `src/pages/ai/embedding-visualizer.astro`
- `src/pages/ai/api-request-builder.astro`
- `src/__tests__/lib/llm/rate-limit-calculator.test.ts`
- `src/__tests__/lib/llm/prompt-format-converter.test.ts`
- `src/__tests__/lib/llm/few-shot-builder.test.ts`
- `src/__tests__/lib/llm/prompt-variable-filler.test.ts`
- `src/__tests__/lib/llm/schema-builder.test.ts`
- `src/__tests__/lib/llm/finetuning-validator.test.ts`
- `src/__tests__/lib/llm/embedding-visualizer.test.ts`
- `src/__tests__/lib/llm/api-request-builder.test.ts`

### Modify

- `src/data/tools-data.ts`: add Phase 3 tool entries.
- `src/components/tools/ai/shared/related-tools.tsx`: add Phase 3 related-tool edges.

---

### Task 1: Add Phase 3 Tool Registry Entries

**Files:**
- Modify: `src/data/tools-data.ts`

- [ ] **Step 1: Add Phase 3 tools**

Append these entries to `toolsData`:

```typescript
  {
    id: 'rate-limit-calculator',
    name: 'Rate Limit Calculator',
    description: 'Calculate LLM API throughput from TPM, RPM, TPD, concurrency, and request size.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Models & Providers',
    icon: 'Timer',
    features: ['TPM/RPM limits', 'Daily capacity', 'Concurrency planning', 'Bottleneck detection'],
    tags: ['rate-limit', 'tpm', 'rpm', 'llm-api', 'throughput'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/ai/rate-limit-calculator',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'prompt-format-converter',
    name: 'Prompt Format Converter',
    description: 'Convert prompts between OpenAI messages, Anthropic messages, Gemini contents, ChatML, and Parsify IR.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Prompt Engineering',
    icon: 'ArrowsLeftRight',
    features: ['Parsify IR', 'OpenAI payloads', 'Anthropic payloads', 'Gemini payloads'],
    tags: ['prompt-converter', 'openai-to-claude', 'chatml', 'gemini', 'llm'],
    difficulty: 'advanced',
    status: 'stable',
    href: '/ai/prompt-format-converter',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'few-shot-builder',
    name: 'Few-shot Builder',
    description: 'Generate structured few-shot prompts from task descriptions and input/output examples.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Prompt Engineering',
    icon: 'StackPlus',
    features: ['XML output', 'JSON output', 'Markdown output', 'Token estimates'],
    tags: ['few-shot', 'prompt-builder', 'examples', 'xml-prompt'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/ai/few-shot-builder',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'prompt-variable-filler',
    name: 'Prompt Variable Filler',
    description: 'Extract prompt variables, fill templates, and export batch prompts as JSONL.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Prompt Engineering',
    icon: 'BracketsAngle',
    features: ['Variable extraction', 'Template filling', 'Batch rows', 'JSONL export'],
    tags: ['prompt-template', 'variables', 'batch-prompts', 'jsonl'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/ai/prompt-variable-filler',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'schema-builder',
    name: 'Tool Schema Builder',
    description: 'Build LLM tool schemas with form rows and export provider-specific tool formats.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Tool Calling',
    icon: 'ListPlus',
    features: ['Parameter rows', 'JSON Schema output', 'OpenAI tools', 'Anthropic tools'],
    tags: ['tool-schema-builder', 'function-calling', 'json-schema', 'mcp'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/ai/schema-builder',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'finetuning-validator',
    name: 'Fine-tuning Dataset Validator',
    description: 'Validate OpenAI-style JSONL fine-tuning datasets for format, roles, duplicates, and token size.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'RAG & Data',
    icon: 'Database',
    features: ['JSONL validation', 'Role sequence checks', 'Duplicate detection', 'Clean export'],
    tags: ['fine-tuning', 'jsonl', 'dataset-validator', 'openai'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/ai/finetuning-validator',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'embedding-visualizer',
    name: 'Embedding Similarity Visualizer',
    description: 'Compare embedding vectors with cosine similarity, nearest neighbors, and simple 2D projection.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'RAG & Data',
    icon: 'Graph',
    features: ['Cosine similarity', 'Similarity matrix', 'Nearest neighbors', 'Manual vectors'],
    tags: ['embeddings', 'similarity', 'rag', 'vectors', 'visualizer'],
    difficulty: 'advanced',
    status: 'stable',
    href: '/ai/embedding-visualizer',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'api-request-builder',
    name: 'LLM API Request Builder',
    description: 'Build provider-specific LLM API payloads and export curl and TypeScript fetch snippets.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'API Debugging',
    icon: 'TerminalWindow',
    features: ['Payload builder', 'curl export', 'TypeScript export', 'BYOK direct send'],
    tags: ['llm-api', 'request-builder', 'openai', 'anthropic', 'gemini'],
    difficulty: 'advanced',
    status: 'stable',
    href: '/ai/api-request-builder',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
```

- [ ] **Step 2: Verify registry**

Run: `bun run typecheck`

Expected: 0 errors.

---

### Task 2: Add Shared BYOK Components And Related Links

**Files:**
- Create: `src/components/tools/ai/shared/provider-selector.tsx`
- Create: `src/components/tools/ai/shared/byok-notice.tsx`
- Modify: `src/components/tools/ai/shared/related-tools.tsx`

- [ ] **Step 1: Create `ProviderSelector`**

```typescript
'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type SupportedProvider = 'openai' | 'anthropic' | 'google';

interface ProviderSelectorProps {
  value: SupportedProvider;
  onValueChange: (value: SupportedProvider) => void;
}

export function ProviderSelector({ value, onValueChange }: ProviderSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Provider</Label>
      <Select value={value} onValueChange={(next) => onValueChange(next as SupportedProvider)}>
        <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="openai">OpenAI</SelectItem>
          <SelectItem value="anthropic">Anthropic</SelectItem>
          <SelectItem value="google">Google Gemini</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 2: Create `BYOKNotice`**

```typescript
'use client';

export function BYOKNotice() {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
      Provider calls are sent directly from your browser to the provider. Parsify does not receive your API key or request body.
    </div>
  );
}
```

- [ ] **Step 3: Extend related tools mapping**

Add these keys to `relatedToolIds` in `related-tools.tsx`:

```typescript
  'rate-limit-calculator': ['model-comparison', 'api-request-builder'],
  'prompt-format-converter': ['tool-schema-converter', 'api-request-builder', 'prompt-diff'],
  'few-shot-builder': ['prompt-linter', 'prompt-variable-filler', 'token-counter'],
  'prompt-variable-filler': ['few-shot-builder', 'prompt-diff', 'api-request-builder'],
  'schema-builder': ['tool-schema-converter', 'schema-generator', 'output-validator'],
  'finetuning-validator': ['jsonl-viewer', 'token-counter', 'cost-calculator'],
  'embedding-visualizer': ['api-request-builder', 'model-comparison'],
  'api-request-builder': ['prompt-format-converter', 'schema-builder', 'sse-parser'],
```

- [ ] **Step 4: Verify**

Run: `bun run typecheck`

Expected: 0 errors.

---

### Task 3: Implement Rate Limit Calculator

**Files:**
- Create: `src/lib/llm/rate-limit-calculator.ts`
- Create: `src/__tests__/lib/llm/rate-limit-calculator.test.ts`
- Create: `src/components/tools/ai/rate-limit-calculator.tsx`
- Create: `src/pages/ai/rate-limit-calculator.astro`

- [ ] **Step 1: Write tests**

```typescript
import { describe, expect, it } from 'vitest';
import { calculateRateLimits } from '@/lib/llm/rate-limit-calculator';

describe('calculateRateLimits', () => {
  it('detects token bottlenecks', () => {
    const result = calculateRateLimits({ tpm: 10000, rpm: 1000, tpd: 1000000, maxConcurrency: 50, averageInputTokens: 1000, averageOutputTokens: 1000, desiredRps: 10 });

    expect(result.bottleneck).toBe('TPM');
    expect(result.maxRpmByTokens).toBe(5);
  });
});
```

- [ ] **Step 2: Implement logic**

`calculateRateLimits(input)` returns `{ maxRpmByTokens, maxRpmByRequests, maxSustainedRps, dailyRequestCapacity, bottleneck, recommendation }`. Clamp negative inputs to 0. Total request tokens = input + output. Bottleneck is the smallest limiting dimension.

- [ ] **Step 3: Add UI and route**

Use numeric inputs, `MetricCard`, result bottleneck badge, `RelatedTools toolId="rate-limit-calculator"`, and route `/ai/rate-limit-calculator`.

- [ ] **Step 4: Verify**

Run:

```bash
bun test src/__tests__/lib/llm/rate-limit-calculator.test.ts
bun run typecheck
```

Expected: pass and 0 errors.

---

### Task 4: Implement Prompt Format Converter

**Files:**
- Create: `src/lib/llm/prompt-format-converter.ts`
- Create: `src/__tests__/lib/llm/prompt-format-converter.test.ts`
- Create: `src/components/tools/ai/prompt-format-converter.tsx`
- Create: `src/pages/ai/prompt-format-converter.astro`

- [ ] **Step 1: Write tests**

```typescript
import { describe, expect, it } from 'vitest';
import { parseOpenAIMessages, serializePromptIR } from '@/lib/llm/prompt-format-converter';

describe('prompt format converter', () => {
  it('parses OpenAI messages into IR', () => {
    const ir = parseOpenAIMessages([{ role: 'system', content: 'Be concise' }, { role: 'user', content: 'Hi' }]);
    expect(ir.system).toBe('Be concise');
    expect(ir.messages[0]?.role).toBe('user');
  });

  it('serializes Anthropic payloads', () => {
    const output = serializePromptIR({ version: '1.0', system: 'Rules', messages: [{ role: 'user', content: 'Hi' }], tools: [] }, 'anthropic');
    expect(output.system).toBe('Rules');
    expect(output.messages).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Implement logic**

Define `PromptIR`, `parseOpenAIMessages`, `serializePromptIR(ir, provider)`, and `toChatML(ir)`. Support providers `openai`, `anthropic`, `google`.

- [ ] **Step 3: Add UI and route**

Use JSON input, provider tabs/output via `CodeExportTabs`, `RelatedTools toolId="prompt-format-converter"`, and route.

- [ ] **Step 4: Verify**

Run tests and typecheck.

---

### Task 5: Implement Few-shot Builder And Variable Filler

**Files:**
- Create: `src/lib/llm/few-shot-builder.ts`
- Create: `src/lib/llm/prompt-variable-filler.ts`
- Create: `src/__tests__/lib/llm/few-shot-builder.test.ts`
- Create: `src/__tests__/lib/llm/prompt-variable-filler.test.ts`
- Create: `src/components/tools/ai/few-shot-builder.tsx`
- Create: `src/components/tools/ai/prompt-variable-filler.tsx`
- Create: `src/pages/ai/few-shot-builder.astro`
- Create: `src/pages/ai/prompt-variable-filler.astro`

- [ ] **Step 1: Write tests**

Test `renderFewShotPrompt()` for XML and Markdown output. Test `extractTemplateVariables()`, `fillPromptTemplate()`, and `exportFilledPromptsJsonl()`.

- [ ] **Step 2: Implement logic**

`few-shot-builder.ts` exports `renderFewShotPrompt({ task, examples, style })` and `getFewShotRecommendation(count)`. `prompt-variable-filler.ts` exports variable extraction, single-fill, simple comma-separated batch rows, and JSONL export.

- [ ] **Step 3: Add UIs and routes**

Few-shot UI: task textarea, dynamic examples, style select, rendered output. Variable filler UI: template textarea, variable inputs, filled prompt, JSONL output. Add related tools.

- [ ] **Step 4: Verify**

Run both test files and typecheck.

---

### Task 6: Implement Tool Schema Builder And Fine-tuning Validator

**Files:**
- Create: `src/lib/llm/schema-builder.ts`
- Create: `src/lib/llm/finetuning-validator.ts`
- Create: `src/__tests__/lib/llm/schema-builder.test.ts`
- Create: `src/__tests__/lib/llm/finetuning-validator.test.ts`
- Create: `src/components/tools/ai/schema-builder.tsx`
- Create: `src/components/tools/ai/finetuning-validator.tsx`
- Create: `src/pages/ai/schema-builder.astro`
- Create: `src/pages/ai/finetuning-validator.astro`

- [ ] **Step 1: Write tests**

Test schema builder creates required properties and provider formats. Test fine-tuning validator detects valid OpenAI-style records, role warnings, and duplicates.

- [ ] **Step 2: Implement logic**

`schema-builder.ts` exports `buildToolSchema()` and `buildProviderToolFormats()`. `finetuning-validator.ts` exports `validateFineTuningJsonl(input)` and returns counts, warnings, duplicate count, token stats, and clean JSONL.

- [ ] **Step 3: Add UIs and routes**

Schema builder UI: tool metadata + parameter rows + JSON output tabs. Fine-tuning validator UI: JSONL textarea + metric cards + warning list + clean export.

- [ ] **Step 4: Verify**

Run both test files and typecheck.

---

### Task 7: Implement Embedding Visualizer And API Request Builder

**Files:**
- Create: `src/lib/llm/embedding-visualizer.ts`
- Create: `src/lib/llm/api-request-builder.ts`
- Create: `src/lib/llm/provider-client.ts`
- Create: `src/__tests__/lib/llm/embedding-visualizer.test.ts`
- Create: `src/__tests__/lib/llm/api-request-builder.test.ts`
- Create: `src/components/tools/ai/embedding-visualizer.tsx`
- Create: `src/components/tools/ai/api-request-builder.tsx`
- Create: `src/pages/ai/embedding-visualizer.astro`
- Create: `src/pages/ai/api-request-builder.astro`

- [ ] **Step 1: Write tests**

Test cosine similarity and similarity matrix. Test OpenAI/Anthropic/Google payload generation and curl/fetch snippets. Do not call live APIs.

- [ ] **Step 2: Implement logic**

`embedding-visualizer.ts` exports `cosineSimilarity`, `buildSimilarityMatrix`, and `projectVectors2D`. `api-request-builder.ts` exports `buildLLMRequest(provider, input)`, `buildCurlCommand`, and `buildFetchSnippet`. `provider-client.ts` exports `sendProviderRequest({ url, apiKey, payload, headers })` for browser direct fetch.

- [ ] **Step 3: Add UIs and routes**

Embedding UI: manual vectors textarea, similarity matrix, nearest neighbors, BYOK notice. API builder UI: provider selector, model, prompts, parameters, payload/code tabs, optional API key field and send button.

- [ ] **Step 4: Verify**

Run both test files and typecheck.

---

### Task 8: Final Verification

**Files:**
- No planned file changes unless verification reveals issues.

- [ ] **Step 1: Run lint**

Run: `bun run lint`

Expected: pass.

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`

Expected: 0 errors.

- [ ] **Step 3: Run tests**

Run: `bun test`

Expected: all LLM tests pass.

- [ ] **Step 4: Run build**

Run: `bun run build`

Expected: Astro build succeeds.

## Self-Review

Spec coverage:

- All eight Phase 3 routes are covered by Tasks 3-7.
- A4 is explicitly excluded.
- Tool registry expansion is covered by Task 1.
- BYOK primitives are covered by Tasks 2 and 7.
- Pure logic and tests are covered by Tasks 3-7.
- Final verification is covered by Task 8.

Known implementation constraints:

- This plan intentionally avoids backend status aggregation, exact tokenizer dependencies, large-file streaming, UMAP/t-SNE dependencies, and live provider calls in tests.
