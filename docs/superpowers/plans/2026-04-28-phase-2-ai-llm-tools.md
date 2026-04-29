# Phase 2 AI/LLM Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the eight Phase 2 AI/LLM tools: context visualizer, prompt cache calculator, prompt diff, prompt linter, schema generator, output validator, JSONL viewer, and model comparison.

**Architecture:** Extend the Phase 1 Astro + React island structure. Pure logic lives in `src/lib/llm/`, React tool UIs live in `src/components/tools/ai/`, and Astro routes live in `src/pages/ai/`.

**Tech Stack:** Astro 5, React 19, TypeScript strict mode, Tailwind CSS, existing shadcn-style UI components, Vitest, Biome, Bun.

---

## Implementation Notes

Do not create git commits unless the user explicitly asks. The original writing-plans workflow recommends frequent commits, but this repository instruction forbids committing without explicit user request.

Use approximate token counting via `estimateTokens()` from `src/lib/llm/text-chunker.ts` for Phase 2. Do not add tokenizer dependencies in this plan.

When Astro reports import-name conflicts for hydrated components, import with an alias and use that alias as the JSX tag:

```astro
import { ContextVisualizer as ContextVisualizerTool } from '../../components/tools/ai/context-visualizer';

<ContextVisualizerTool client:load />
```

## File Map

### Create

- `src/lib/llm/context-visualizer.ts`: parse messages and compute context-window usage.
- `src/lib/llm/prompt-cache.ts`: cache break-even and savings math.
- `src/lib/llm/prompt-diff.ts`: prompt diff, variable extraction, and structural counts.
- `src/lib/llm/prompt-linter.ts`: deterministic prompt lint rules and scoring.
- `src/lib/llm/schema-generator.ts`: JSON example to LLM-friendly JSON Schema.
- `src/lib/llm/structured-output-validator.ts`: code fence stripping, JSON parsing, schema subset validation.
- `src/lib/llm/jsonl.ts`: parse, edit, and serialize JSONL records.
- `src/lib/llm/model-comparison.ts`: registry model filtering and sorting.
- `src/components/tools/ai/shared/metric-card.tsx`: reusable metric card.
- `src/components/tools/ai/shared/json-textarea.tsx`: textarea with JSON parse status.
- `src/components/tools/ai/shared/related-tools.tsx`: related tool links from `tools-data.ts`.
- `src/components/tools/ai/context-visualizer.tsx`
- `src/components/tools/ai/cache-calculator.tsx`
- `src/components/tools/ai/prompt-diff.tsx`
- `src/components/tools/ai/prompt-linter.tsx`
- `src/components/tools/ai/schema-generator.tsx`
- `src/components/tools/ai/output-validator.tsx`
- `src/components/tools/ai/jsonl-viewer.tsx`
- `src/components/tools/ai/model-comparison.tsx`
- `src/pages/ai/context-visualizer.astro`
- `src/pages/ai/cache-calculator.astro`
- `src/pages/ai/prompt-diff.astro`
- `src/pages/ai/prompt-linter.astro`
- `src/pages/ai/schema-generator.astro`
- `src/pages/ai/output-validator.astro`
- `src/pages/ai/jsonl-viewer.astro`
- `src/pages/ai/model-comparison.astro`
- `src/__tests__/lib/llm/context-visualizer.test.ts`
- `src/__tests__/lib/llm/prompt-cache.test.ts`
- `src/__tests__/lib/llm/prompt-diff.test.ts`
- `src/__tests__/lib/llm/prompt-linter.test.ts`
- `src/__tests__/lib/llm/schema-generator.test.ts`
- `src/__tests__/lib/llm/structured-output-validator.test.ts`
- `src/__tests__/lib/llm/jsonl.test.ts`
- `src/__tests__/lib/llm/model-comparison.test.ts`

### Modify

- `src/data/tools-data.ts`: add eight Phase 2 tool entries and two subcategories.
- `src/types/llm.ts`: add shared schema/validation types if needed by multiple modules.

---

### Task 1: Add Phase 2 Tool Registry Entries

**Files:**
- Modify: `src/data/tools-data.ts`

- [ ] **Step 1: Add Phase 2 tools to `toolsData`**

Append these tool objects after the Phase 1 entries:

```typescript
  {
    id: 'context-visualizer',
    name: 'Context Window Visualizer',
    description:
      'Visualize how prompts, messages, and RAG context consume an LLM context window.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Tokens & Cost',
    icon: 'ChartBar',
    features: ['Message parsing', 'Context usage', 'Segment breakdown', 'Trim suggestions'],
    tags: ['context-window', 'tokens', 'rag', 'messages', 'llm'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/ai/context-visualizer',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'cache-calculator',
    name: 'Prompt Cache Calculator',
    description:
      'Calculate whether prompt caching saves money based on static tokens, dynamic tokens, usage, and hit rate.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Tokens & Cost',
    icon: 'PiggyBank',
    features: ['Cache savings', 'Break-even calls', 'Hit-rate modeling', 'Registry pricing'],
    tags: ['prompt-cache', 'pricing', 'anthropic', 'openai', 'llm-cost'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/ai/cache-calculator',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'prompt-diff',
    name: 'Prompt Diff',
    description: 'Compare prompt versions with token delta, variable extraction, and structure summaries.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Prompt Engineering',
    icon: 'GitDiff',
    features: ['Line diff', 'Token delta', 'Variable extraction', 'Structure counts'],
    tags: ['prompt-diff', 'prompt-versioning', 'compare-prompts', 'llm'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/ai/prompt-diff',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'prompt-linter',
    name: 'System Prompt Linter',
    description: 'Analyze system prompts for clarity, structure, safety, and maintainability issues.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Prompt Engineering',
    icon: 'ListChecks',
    features: ['Rule-based findings', 'Prompt score', 'Severity levels', 'Rewrite suggestions'],
    tags: ['prompt-linter', 'system-prompt', 'prompt-analysis', 'prompt-engineering'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/ai/prompt-linter',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'schema-generator',
    name: 'LLM JSON Schema Generator',
    description: 'Generate LLM-friendly JSON Schema from JSON examples with provider compatibility notes.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Tool Calling',
    icon: 'BracketsCurly',
    features: ['JSON example input', 'Schema generation', 'Strict mode hints', 'Compatibility warnings'],
    tags: ['json-schema', 'structured-output', 'tool-calling', 'openai', 'anthropic'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/ai/schema-generator',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'output-validator',
    name: 'Structured Output Validator',
    description: 'Validate LLM JSON output against a schema and locate field-level errors.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Tool Calling',
    icon: 'CheckCircle',
    features: ['Code fence stripping', 'Schema validation', 'Field paths', 'Repair hints'],
    tags: ['structured-output', 'json-schema-validator', 'llm-output', 'json'],
    difficulty: 'intermediate',
    status: 'stable',
    href: '/ai/output-validator',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'jsonl-viewer',
    name: 'JSONL Viewer / Editor',
    description: 'Inspect, validate, lightly edit, and export JSONL datasets in your browser.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'RAG & Data',
    icon: 'Table',
    features: ['Line validation', 'Record preview', 'Field summary', 'JSONL export'],
    tags: ['jsonl', 'fine-tuning', 'batch-api', 'dataset', 'viewer'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/ai/jsonl-viewer',
    processingType: 'client-side',
    security: 'local-only',
  },
  {
    id: 'model-comparison',
    name: 'Model Comparison Table',
    description: 'Filter and compare LLM models by context window, pricing, capabilities, and provider.',
    category: AI_TOOLS_CATEGORY,
    subcategory: 'Models & Providers',
    icon: 'Scales',
    features: ['Provider filters', 'Capability filters', 'Pricing sort', 'Context comparison'],
    tags: ['llm-comparison', 'model-comparison', 'claude-vs-gpt', 'pricing'],
    difficulty: 'beginner',
    status: 'stable',
    href: '/ai/model-comparison',
    isPopular: true,
    processingType: 'client-side',
    security: 'local-only',
  },
```

- [ ] **Step 2: Add missing subcategories**

Ensure `toolCategories[0].subcategories` contains these entries:

```typescript
{ id: 'prompt-engineering', name: 'Prompt Engineering' },
{ id: 'models-providers', name: 'Models & Providers' },
```

- [ ] **Step 3: Verify the registry compiles**

Run:

```bash
bun run typecheck
```

Expected: 0 errors.

---

### Task 2: Add Shared Phase 2 Components

**Files:**
- Create: `src/components/tools/ai/shared/metric-card.tsx`
- Create: `src/components/tools/ai/shared/json-textarea.tsx`
- Create: `src/components/tools/ai/shared/related-tools.tsx`

- [ ] **Step 1: Create `MetricCard`**

Create `src/components/tools/ai/shared/metric-card.tsx`:

```typescript
'use client';

import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
}

export function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create `JsonTextarea`**

Create `src/components/tools/ai/shared/json-textarea.tsx`:

```typescript
'use client';

import { Textarea } from '@/components/ui/textarea';

interface JsonTextareaProps {
  value: string;
  onValueChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function JsonTextarea({ value, onValueChange, rows = 12, placeholder }: JsonTextareaProps) {
  let status = 'Valid JSON';
  if (value.trim().length === 0) {
    status = 'Empty input';
  } else {
    try {
      JSON.parse(value);
    } catch (error) {
      status = error instanceof Error ? error.message : 'Invalid JSON';
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
      <p className="text-xs text-muted-foreground">{status}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create `RelatedTools`**

Create `src/components/tools/ai/shared/related-tools.tsx`:

```typescript
'use client';

import { toolsData } from '@/data/tools-data';

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
};

interface RelatedToolsProps {
  toolId: string;
}

export function RelatedTools({ toolId }: RelatedToolsProps) {
  const tools = (relatedToolIds[toolId] ?? [])
    .map((id) => toolsData.find((tool) => tool.id === id))
    .filter((tool) => tool !== undefined);

  if (tools.length === 0) return null;

  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Related tools</h2>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {tools.map((tool) => (
          <a key={tool.id} href={tool.href} className="rounded-md border p-3 text-sm hover:border-primary">
            <span className="font-medium">{tool.name}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Verify shared components compile**

Run:

```bash
bun run typecheck
```

Expected: 0 errors.

---

### Task 3: Implement Context Window Visualizer

**Files:**
- Create: `src/lib/llm/context-visualizer.ts`
- Create: `src/__tests__/lib/llm/context-visualizer.test.ts`
- Create: `src/components/tools/ai/context-visualizer.tsx`
- Create: `src/pages/ai/context-visualizer.astro`

- [ ] **Step 1: Write context visualizer tests**

Create `src/__tests__/lib/llm/context-visualizer.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { analyzeContextInput } from '@/lib/llm/context-visualizer';

describe('analyzeContextInput', () => {
  it('parses OpenAI-style messages', () => {
    const result = analyzeContextInput('[{"role":"system","content":"Be concise"},{"role":"user","content":"Hello world"}]', 1000);

    expect(result.segments).toHaveLength(2);
    expect(result.segments[0]?.role).toBe('system');
    expect(result.totalTokens).toBeGreaterThan(0);
    expect(result.contextUsagePercent).toBeGreaterThan(0);
  });

  it('falls back to one user segment for plain text', () => {
    const result = analyzeContextInput('plain prompt', 1000);

    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]?.role).toBe('user');
  });
});
```

- [ ] **Step 2: Implement context visualizer logic**

Create `src/lib/llm/context-visualizer.ts`:

```typescript
import { estimateTokens } from '@/lib/llm/text-chunker';

export interface ContextSegment {
  id: string;
  role: string;
  label: string;
  content: string;
  characters: number;
  estimatedTokens: number;
  percentShare: number;
}

export interface ContextAnalysis {
  segments: ContextSegment[];
  totalTokens: number;
  contextUsagePercent: number;
  remainingTokens: number;
  trimSuggestion: string;
}

interface MessageLike {
  role?: unknown;
  content?: unknown;
}

function parseMessages(input: string): Array<{ role: string; content: string }> {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((message: MessageLike, index) => ({
        role: typeof message.role === 'string' ? message.role : 'user',
        content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content ?? ''),
      })).filter((message) => message.content.length > 0 || index >= 0);
    }
  } catch {
    const lines = input.split('\n').map((line) => line.trim()).filter(Boolean);
    const roleLines = lines.map((line) => {
      const match = /^(system|user|assistant|tool):\s*(.*)$/i.exec(line);
      return match ? { role: match[1]?.toLowerCase() ?? 'user', content: match[2] ?? '' } : undefined;
    });
    if (roleLines.every((line) => line !== undefined)) return roleLines as Array<{ role: string; content: string }>;
  }

  return [{ role: 'user', content: input }];
}

export function analyzeContextInput(input: string, contextWindow: number): ContextAnalysis {
  const messages = parseMessages(input.trim());
  const rawSegments = messages.map((message, index) => ({
    id: `segment_${index + 1}`,
    role: message.role,
    label: `${message.role} ${index + 1}`,
    content: message.content,
    characters: message.content.length,
    estimatedTokens: estimateTokens(message.content),
  }));
  const totalTokens = rawSegments.reduce((sum, segment) => sum + segment.estimatedTokens, 0);
  const segments = rawSegments.map((segment) => ({
    ...segment,
    percentShare: totalTokens === 0 ? 0 : (segment.estimatedTokens / totalTokens) * 100,
  }));
  const safeWindow = Math.max(1, contextWindow);
  const contextUsagePercent = Math.min(100, (totalTokens / safeWindow) * 100);
  const remainingTokens = Math.max(0, safeWindow - totalTokens);
  const firstTrimCandidate = segments.find((segment) => segment.role !== 'system');

  return {
    segments,
    totalTokens,
    contextUsagePercent,
    remainingTokens,
    trimSuggestion: firstTrimCandidate
      ? `Trim or summarize ${firstTrimCandidate.label} to recover about ${firstTrimCandidate.estimatedTokens} tokens.`
      : 'No non-system segment is available for trimming.',
  };
}
```

- [ ] **Step 3: Add UI and route**

Create `src/components/tools/ai/context-visualizer.tsx` with a model selector, textarea, four `MetricCard`s, a segment table, and `RelatedTools toolId="context-visualizer"`. Create `src/pages/ai/context-visualizer.astro` with title `Context Window Visualizer | Parsify.dev`, description `Visualize prompt and conversation context usage locally.`, canonical `/ai/context-visualizer`, and `<ContextVisualizerTool client:load />`.

- [ ] **Step 4: Verify context visualizer**

Run:

```bash
bun test src/__tests__/lib/llm/context-visualizer.test.ts
bun run typecheck
```

Expected: tests pass and 0 type errors.

---

### Task 4: Implement Prompt Cache Calculator

**Files:**
- Create: `src/lib/llm/prompt-cache.ts`
- Create: `src/__tests__/lib/llm/prompt-cache.test.ts`
- Create: `src/components/tools/ai/cache-calculator.tsx`
- Create: `src/pages/ai/cache-calculator.astro`

- [ ] **Step 1: Write prompt cache tests**

Create `src/__tests__/lib/llm/prompt-cache.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { calculatePromptCache } from '@/lib/llm/prompt-cache';

describe('calculatePromptCache', () => {
  it('calculates savings when cache read is cheaper', () => {
    const result = calculatePromptCache({
      staticTokens: 2000,
      dynamicTokens: 500,
      outputTokens: 500,
      monthlyCalls: 1000,
      inputPrice: 3,
      outputPrice: 15,
      cacheWritePrice: 3.75,
      cacheReadPrice: 0.3,
      hitRate: 0.8,
    });

    expect(result.cachedCost).toBeLessThan(result.uncachedCost);
    expect(result.recommendation).toBe('recommended');
  });
});
```

- [ ] **Step 2: Implement prompt cache logic**

Create `src/lib/llm/prompt-cache.ts`:

```typescript
export interface PromptCacheInput {
  staticTokens: number;
  dynamicTokens: number;
  outputTokens: number;
  monthlyCalls: number;
  inputPrice: number;
  outputPrice: number;
  cacheWritePrice?: number;
  cacheReadPrice?: number;
  hitRate: number;
}

export interface PromptCacheResult {
  uncachedCost: number;
  cachedCost: number;
  savings: number;
  breakEvenCalls: number;
  recommendation: 'recommended' | 'neutral' | 'not-worth-it' | 'unavailable';
}

export function calculatePromptCache(input: PromptCacheInput): PromptCacheResult {
  if (input.cacheWritePrice === undefined || input.cacheReadPrice === undefined) {
    const uncachedCost = ((input.staticTokens + input.dynamicTokens) * input.monthlyCalls / 1_000_000) * input.inputPrice
      + ((input.outputTokens * input.monthlyCalls) / 1_000_000) * input.outputPrice;
    return { uncachedCost, cachedCost: uncachedCost, savings: 0, breakEvenCalls: 0, recommendation: 'unavailable' };
  }

  const hitRate = Math.min(Math.max(input.hitRate, 0), 1);
  const staticMonthlyTokens = input.staticTokens * input.monthlyCalls;
  const dynamicMonthlyTokens = input.dynamicTokens * input.monthlyCalls;
  const outputMonthlyTokens = input.outputTokens * input.monthlyCalls;
  const uncachedCost = ((staticMonthlyTokens + dynamicMonthlyTokens) / 1_000_000) * input.inputPrice
    + (outputMonthlyTokens / 1_000_000) * input.outputPrice;
  const cacheWriteCost = (input.staticTokens / 1_000_000) * input.cacheWritePrice;
  const cacheReadCost = ((staticMonthlyTokens * hitRate) / 1_000_000) * input.cacheReadPrice;
  const staticMissCost = ((staticMonthlyTokens * (1 - hitRate)) / 1_000_000) * input.inputPrice;
  const dynamicCost = (dynamicMonthlyTokens / 1_000_000) * input.inputPrice;
  const outputCost = (outputMonthlyTokens / 1_000_000) * input.outputPrice;
  const cachedCost = cacheWriteCost + cacheReadCost + staticMissCost + dynamicCost + outputCost;
  const savings = uncachedCost - cachedCost;
  const perCallSavings = (input.staticTokens / 1_000_000) * Math.max(0, input.inputPrice - input.cacheReadPrice) * hitRate;
  const breakEvenCalls = perCallSavings === 0 ? 0 : Math.ceil(cacheWriteCost / perCallSavings);
  const recommendation = savings > 1 && input.staticTokens >= 1024 ? 'recommended' : savings > 0 ? 'neutral' : 'not-worth-it';

  return { uncachedCost, cachedCost, savings, breakEvenCalls, recommendation };
}
```

- [ ] **Step 3: Add UI and route**

Create `cache-calculator.tsx` with numeric inputs, `ModelSelector`, and metric cards for uncached cost, cached cost, savings, and break-even calls. Create `cache-calculator.astro` with route metadata and `RelatedTools toolId="cache-calculator"` in the UI.

- [ ] **Step 4: Verify prompt cache calculator**

Run:

```bash
bun test src/__tests__/lib/llm/prompt-cache.test.ts
bun run typecheck
```

Expected: tests pass and 0 type errors.

---

### Task 5: Implement Prompt Diff

**Files:**
- Create: `src/lib/llm/prompt-diff.ts`
- Create: `src/__tests__/lib/llm/prompt-diff.test.ts`
- Create: `src/components/tools/ai/prompt-diff.tsx`
- Create: `src/pages/ai/prompt-diff.astro`

- [ ] **Step 1: Write prompt diff tests**

Create `src/__tests__/lib/llm/prompt-diff.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { comparePrompts, extractPromptVariables } from '@/lib/llm/prompt-diff';

describe('prompt diff helpers', () => {
  it('extracts common prompt variable syntaxes', () => {
    expect(extractPromptVariables('Hello {{name}} ${city} <role>')).toEqual(['{{name}}', '${city}', '<role>']);
  });

  it('summarizes added and removed lines', () => {
    const result = comparePrompts('Do A\nReturn JSON', 'Do A\nReturn strict JSON');

    expect(result.added).toBe(1);
    expect(result.removed).toBe(1);
    expect(result.tokenDelta).not.toBe(0);
  });
});
```

- [ ] **Step 2: Implement prompt diff logic**

Create `src/lib/llm/prompt-diff.ts` with exported `extractPromptVariables(prompt: string): string[]` and `comparePrompts(original: string, revised: string)` returning `{ lines, added, removed, unchanged, tokenDelta, originalVariables, revisedVariables, structure }`. Use line-by-line comparison by index, `estimateTokens()`, and regex `/\{\{[^}]+\}\}|\$\{[^}]+\}|<[^>]+>|\{[a-zA-Z_][\w-]*\}/g`.

- [ ] **Step 3: Add UI and route**

Create `prompt-diff.tsx` with two textareas, summary metric cards, variable lists, diff rows, and `RelatedTools toolId="prompt-diff"`. Create `prompt-diff.astro` with route metadata.

- [ ] **Step 4: Verify prompt diff**

Run:

```bash
bun test src/__tests__/lib/llm/prompt-diff.test.ts
bun run typecheck
```

Expected: tests pass and 0 type errors.

---

### Task 6: Implement System Prompt Linter

**Files:**
- Create: `src/lib/llm/prompt-linter.ts`
- Create: `src/__tests__/lib/llm/prompt-linter.test.ts`
- Create: `src/components/tools/ai/prompt-linter.tsx`
- Create: `src/pages/ai/prompt-linter.astro`

- [ ] **Step 1: Write prompt linter tests**

Create `src/__tests__/lib/llm/prompt-linter.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { lintSystemPrompt } from '@/lib/llm/prompt-linter';

describe('lintSystemPrompt', () => {
  it('flags missing output format', () => {
    const result = lintSystemPrompt('You are a helpful assistant. Answer the user clearly.');

    expect(result.score).toBeLessThan(100);
    expect(result.findings.some((finding) => finding.id === 'missing-output-format')).toBe(true);
  });

  it('keeps scores within 0 and 100', () => {
    const result = lintSystemPrompt('NEVER NEVER NEVER NEVER NEVER NEVER');

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Implement prompt linter logic**

Create `src/lib/llm/prompt-linter.ts` with `PromptFinding`, `PromptLintResult`, and `lintSystemPrompt(prompt: string)`. Implement the ten rules from the spec with deterministic regex/string checks and subtract severity weights: critical 20, warning 10, info 5. Clamp score to 0-100 and compute category scores for clarity, structure, safety, and maintainability.

- [ ] **Step 3: Add UI and route**

Create `prompt-linter.tsx` with textarea, score metric, category metrics, findings list, and `RelatedTools toolId="prompt-linter"`. Create `prompt-linter.astro` with route metadata.

- [ ] **Step 4: Verify prompt linter**

Run:

```bash
bun test src/__tests__/lib/llm/prompt-linter.test.ts
bun run typecheck
```

Expected: tests pass and 0 type errors.

---

### Task 7: Implement Schema Generator And Output Validator

**Files:**
- Create: `src/lib/llm/schema-generator.ts`
- Create: `src/lib/llm/structured-output-validator.ts`
- Create: `src/__tests__/lib/llm/schema-generator.test.ts`
- Create: `src/__tests__/lib/llm/structured-output-validator.test.ts`
- Create: `src/components/tools/ai/schema-generator.tsx`
- Create: `src/components/tools/ai/output-validator.tsx`
- Create: `src/pages/ai/schema-generator.astro`
- Create: `src/pages/ai/output-validator.astro`

- [ ] **Step 1: Write schema generator tests**

Create `src/__tests__/lib/llm/schema-generator.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { generateSchemaFromJson } from '@/lib/llm/schema-generator';

describe('generateSchemaFromJson', () => {
  it('generates object schema with required fields', () => {
    const result = generateSchemaFromJson({ name: 'Ada', age: 36, tags: ['math'] });

    expect(result.schema.type).toBe('object');
    expect(result.schema.required).toEqual(['name', 'age', 'tags']);
    expect(result.schema.additionalProperties).toBe(false);
  });
});
```

- [ ] **Step 2: Write output validator tests**

Create `src/__tests__/lib/llm/structured-output-validator.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { validateStructuredOutput } from '@/lib/llm/structured-output-validator';

describe('validateStructuredOutput', () => {
  it('strips markdown fences and validates required fields', () => {
    const result = validateStructuredOutput('```json\n{"name":"Ada"}\n```', {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
      additionalProperties: false,
    });

    expect(result.valid).toBe(true);
  });

  it('reports missing required fields', () => {
    const result = validateStructuredOutput('{}', {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.path).toBe('$.name');
  });
});
```

- [ ] **Step 3: Implement schema generator**

Create `schema-generator.ts` with `generateSchemaFromJson(value: unknown)` that recursively emits `type`, `properties`, `items`, `required`, `additionalProperties: false`, and warnings for mixed arrays and null values.

- [ ] **Step 4: Implement structured output validator**

Create `structured-output-validator.ts` with `stripMarkdownCodeFence(input: string)` and `validateStructuredOutput(output: string, schema: Record<string, unknown>)`. Support object, array, string, number, boolean, enum, required, and `additionalProperties: false`.

- [ ] **Step 5: Add UIs and routes**

Create `schema-generator.tsx` and `output-validator.tsx` using `JsonTextarea`, `CodeExportTabs`, metric/error panels, and related tools. Create both `.astro` routes.

- [ ] **Step 6: Verify schema tools**

Run:

```bash
bun test src/__tests__/lib/llm/schema-generator.test.ts src/__tests__/lib/llm/structured-output-validator.test.ts
bun run typecheck
```

Expected: tests pass and 0 type errors.

---

### Task 8: Implement JSONL Viewer And Model Comparison

**Files:**
- Create: `src/lib/llm/jsonl.ts`
- Create: `src/lib/llm/model-comparison.ts`
- Create: `src/__tests__/lib/llm/jsonl.test.ts`
- Create: `src/__tests__/lib/llm/model-comparison.test.ts`
- Create: `src/components/tools/ai/jsonl-viewer.tsx`
- Create: `src/components/tools/ai/model-comparison.tsx`
- Create: `src/pages/ai/jsonl-viewer.astro`
- Create: `src/pages/ai/model-comparison.astro`

- [ ] **Step 1: Write JSONL tests**

Create `src/__tests__/lib/llm/jsonl.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { parseJsonl, serializeJsonl, updateJsonlRecord } from '@/lib/llm/jsonl';

describe('jsonl helpers', () => {
  it('parses valid and invalid lines', () => {
    const result = parseJsonl('{"a":1}\nnot json');

    expect(result.records).toHaveLength(1);
    expect(result.errors[0]?.line).toBe(2);
  });

  it('updates and serializes records', () => {
    const parsed = parseJsonl('{"a":1}');
    const updated = updateJsonlRecord(parsed.records, 0, { a: 2 });

    expect(serializeJsonl(updated)).toBe('{"a":2}');
  });
});
```

- [ ] **Step 2: Write model comparison tests**

Create `src/__tests__/lib/llm/model-comparison.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { filterModelsForComparison, sortModelsForComparison } from '@/lib/llm/model-comparison';
import { llmModels } from '@/lib/llm/registry';

describe('model comparison helpers', () => {
  it('filters by provider and capability', () => {
    const result = filterModelsForComparison(llmModels, { provider: 'anthropic', capability: 'tool_use' });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((model) => model.provider === 'anthropic')).toBe(true);
  });

  it('sorts by input price', () => {
    const result = sortModelsForComparison(llmModels, 'inputPrice');

    expect(result[0]?.pricing.input).toBeLessThanOrEqual(result.at(-1)?.pricing.input ?? Number.POSITIVE_INFINITY);
  });
});
```

- [ ] **Step 3: Implement JSONL helpers**

Create `jsonl.ts` with `parseJsonl(input)`, `serializeJsonl(records)`, `updateJsonlRecord(records, index, value)`, and field summary counts from object keys.

- [ ] **Step 4: Implement model comparison helpers**

Create `model-comparison.ts` with `filterModelsForComparison(models, filters)` and `sortModelsForComparison(models, sortKey)`. Support provider, capability, minContextWindow, maxInputPrice, and sort keys `name`, `contextWindow`, `inputPrice`, `outputPrice`.

- [ ] **Step 5: Add UIs and routes**

Create `jsonl-viewer.tsx` with JSONL textarea, metrics, record list, selected-record editor, and output textarea. Create `model-comparison.tsx` with filters, sorting, model table, and related tools. Create both `.astro` routes.

- [ ] **Step 6: Verify data/model tools**

Run:

```bash
bun test src/__tests__/lib/llm/jsonl.test.ts src/__tests__/lib/llm/model-comparison.test.ts
bun run typecheck
```

Expected: tests pass and 0 type errors.

---

### Task 9: Final Verification

**Files:**
- No planned file changes unless verification reveals issues.

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

Expected: 0 errors.

- [ ] **Step 3: Run tests**

Run:

```bash
bun test
```

Expected: all LLM tests pass.

- [ ] **Step 4: Run build**

Run:

```bash
bun run build
```

Expected: Astro build succeeds.

## Self-Review

Spec coverage:

- All eight Phase 2 routes are covered by Tasks 3-8.
- Tool registry expansion is covered by Task 1.
- Shared Phase 2 components and related tools are covered by Task 2.
- Pure logic modules and tests are covered by Tasks 3-8.
- Final verification is covered by Task 9.

Known implementation constraint:

- This plan keeps exact tokenizer and large-file JSONL support out of scope. Both are intentionally deferred to avoid bundle and complexity growth.
