# Phase 2 AI/LLM Tools Design

Date: 2026-04-28

Source plan: `parsify.md`

Depends on: `docs/superpowers/specs/2026-04-28-ai-llm-tools-pivot-design.md`

## Summary

Phase 2 deepens the AI/LLM tool suite after the Phase 1 pivot. The goal is to add the prompt, context, schema, JSONL, and model-comparison tools that make the site useful for recurring LLM application debugging work instead of only first-touch utilities.

Phase 2 covers eight tools:

- T3 Context Window Visualizer
- T4 Prompt Cache Calculator
- P1 Prompt Diff
- P3 System Prompt Linter
- S1 LLM JSON Schema Generator
- S4 Structured Output Validator
- R2 JSONL Viewer / Editor
- A2 Model Comparison Table

All tools remain browser-first. No user prompt, schema, model output, or dataset content is sent to Parsify infrastructure.

## Goals

- Add eight Phase 2 tools under `/ai/*` using the Astro + React island architecture established in Phase 1.
- Extend the shared AI tool foundation with reusable parsers, estimators, related-tool metadata, and registry-driven UI helpers.
- Keep business logic in pure functions under `src/lib/llm/` and UI in `src/components/tools/ai/`.
- Expand `src/data/tools-data.ts` so Phase 1 and Phase 2 tools are discoverable from home and `/ai/`.
- Use the existing `src/data/llm-registry.json` for model metadata in context, cost, cache, and comparison tools.
- Add tests for pure logic: prompt analysis, context parsing, JSON schema generation, structured output validation, JSONL parsing, and model filtering.

## Non-Goals

- Implement Phase 3 tools.
- Add accounts, server persistence, team sharing, or Pro subscription flows.
- Add backend LLM calls.
- Add full tokenizer WASM integrations in this phase. Token counts can continue using the Phase 1 approximate estimator unless a tool requires exact counting for correctness.
- Build full blog/MDX content pages for prompt-linter rules. Rule metadata should be structured so content pages can be added later.

## Existing Foundation

The current codebase already has:

- `/ai/` route structure.
- Phase 1 tool pages and React components.
- `src/data/llm-registry.json` with model metadata.
- `src/types/llm.ts` for model and pricing types.
- `src/lib/llm/` with registry, cost, text chunking, SSE, and tool schema conversion helpers.
- Shared components under `src/components/tools/ai/shared/`.
- 8 passing LLM utility tests.

Phase 2 should extend this foundation rather than introduce a separate architecture.

## Route Scope

Add these routes:

```text
src/pages/ai/
├── context-visualizer.astro
├── cache-calculator.astro
├── prompt-diff.astro
├── prompt-linter.astro
├── schema-generator.astro
├── output-validator.astro
├── jsonl-viewer.astro
└── model-comparison.astro
```

Each route must use Astro for metadata and hydrate a React component with `client:load`. If Astro typecheck reports import-name conflicts, alias named imports at the import site and use the alias as the hydrated tag.

## Tool Registry

`src/data/tools-data.ts` should include Phase 1 and Phase 2 active tools. All Phase 2 tools should use category `AI & LLM Tools` and one of these subcategories:

- Tokens & Cost
- Prompt Engineering
- Tool Calling
- RAG & Data
- API Debugging
- Models & Providers

Phase 2 tool route mapping:

| Tool | Route | Subcategory |
|---|---|---|
| Context Window Visualizer | `/ai/context-visualizer` | Tokens & Cost |
| Prompt Cache Calculator | `/ai/cache-calculator` | Tokens & Cost |
| Prompt Diff | `/ai/prompt-diff` | Prompt Engineering |
| System Prompt Linter | `/ai/prompt-linter` | Prompt Engineering |
| LLM JSON Schema Generator | `/ai/schema-generator` | Tool Calling |
| Structured Output Validator | `/ai/output-validator` | Tool Calling |
| JSONL Viewer / Editor | `/ai/jsonl-viewer` | RAG & Data |
| Model Comparison Table | `/ai/model-comparison` | Models & Providers |

## Shared Data And Utilities

Add focused pure modules under `src/lib/llm/`:

- `context-visualizer.ts`: parse message JSON or markdown-ish conversation text into context segments with estimated token counts.
- `prompt-cache.ts`: calculate cache break-even and monthly savings using registry pricing.
- `prompt-diff.ts`: line/section diff helpers plus prompt variable extraction.
- `prompt-linter.ts`: deterministic prompt lint rules and scoring.
- `schema-generator.ts`: generate LLM-friendly JSON Schema from a JSON example.
- `structured-output-validator.ts`: strip markdown code fences, parse JSON output, and validate against a practical JSON Schema subset.
- `jsonl.ts`: parse, validate, edit, and serialize JSONL records.
- `model-comparison.ts`: filter, sort, and compare registry models.

These modules should avoid browser-only APIs so tests can run in Vitest without DOM dependencies.

## Shared Components

Add shared UI components only when reused by two or more Phase 2 tools:

- `RelatedTools`: render internal links for active related tools.
- `JsonTextarea`: textarea wrapper with JSON parse status and formatted error display.
- `MetricCard`: compact metric display for counts, cost, tokens, or scores.
- `ToolSection`: consistent card section wrapper for input/output panels if repeated patterns emerge.

Do not introduce a large internal UI package. Keep components local to `src/components/tools/ai/shared/`.

## Tool Designs

### T3 Context Window Visualizer

Purpose: show how a conversation or RAG context consumes a selected model's context window.

Inputs:

- selected model
- messages JSON array or markdown-ish conversation text

Outputs:

- total estimated tokens
- percent of selected model context window
- remaining estimated tokens
- segment table with role, label, character count, token estimate, and percent share
- simple trimming suggestion based on oldest non-system segments

Parsing rules:

- JSON input accepts OpenAI-style `{ role, content }[]`.
- Markdown-ish input can split headings or role prefixes such as `system:`, `user:`, `assistant:`.
- Unknown content is treated as a single user segment.

### T4 Prompt Cache Calculator

Purpose: help developers decide whether prompt caching is worth enabling.

Inputs:

- selected model
- static prompt tokens
- dynamic prompt tokens
- output tokens
- monthly calls
- cache hit rate

Outputs:

- uncached monthly cost
- cached monthly cost
- monthly savings
- break-even call count
- recommendation label: `recommended`, `neutral`, or `not-worth-it`

Pricing uses `cacheWrite` and `cacheRead` when available. If a model has no cache pricing, the UI must clearly say prompt caching data is unavailable for that model.

### P1 Prompt Diff

Purpose: compare two prompt versions with prompt-specific metadata.

Inputs:

- original prompt
- revised prompt
- optional role labels for each side

Outputs:

- line-level diff
- added, removed, unchanged counts
- token estimate delta
- variables found in each prompt (`{{var}}`, `{var}`, `${var}`, `<placeholder>`)
- structural counts for instructions, examples, constraints, and role markers

Implementation should not resurrect the old generic diff viewer wholesale. Build a small prompt-focused diff helper in `src/lib/llm/prompt-diff.ts` and keep UI simple.

### P3 System Prompt Linter

Purpose: statically analyze system prompts for common LLM prompt anti-patterns.

Initial rules:

- missing output format
- too short for complex tasks
- too long for maintainability
- excessive uppercase
- excessive `MUST` / `NEVER`
- repeated negative instructions
- ambiguous pronouns
- missing role or task definition
- missing examples for transformation/classification tasks
- user-input placeholder may be interpreted as instructions

Outputs:

- score from 0 to 100
- findings with severity, title, explanation, and suggestion
- category breakdown: clarity, structure, safety, maintainability

Rule definitions should be data-driven so more rules can be added later without rewriting the UI.

### S1 LLM JSON Schema Generator

Purpose: generate LLM-friendly JSON Schema from a JSON example.

Initial scope:

- JSON instance input only.
- TypeScript interface and Zod input are later enhancements.
- Generated schema should use `type`, `properties`, `items`, `required`, `additionalProperties: false`, and `description` placeholders.

Outputs:

- generated JSON Schema
- compatibility notes for OpenAI strict mode, Anthropic, and Gemini
- warnings for unsupported or ambiguous constructs such as mixed arrays or null-heavy fields

### S4 Structured Output Validator

Purpose: validate actual LLM output against a schema.

Inputs:

- JSON Schema
- LLM output text

Behavior:

- strip markdown code fences when present
- parse JSON
- validate required fields, primitive types, arrays, objects, enum, and `additionalProperties: false`
- report field-path errors like `$.items[0].name`

Full AJV dependency is not required for the first Phase 2 implementation. A practical validator for the generated schema subset is enough and keeps the client bundle small.

### R2 JSONL Viewer / Editor

Purpose: inspect and lightly edit JSONL datasets and batch outputs in the browser.

Initial scope:

- paste JSONL text
- parse line by line
- show valid record count, invalid line count, and field summary
- render records in table-like cards or a simple table
- allow editing one selected record as JSON
- serialize records back to JSONL

Large file streaming and >100MB virtualization are later enhancements. The first implementation should avoid claiming large-file support.

### A2 Model Comparison Table

Purpose: expose the value of `llm-registry.json` through a sortable/filterable model table.

Inputs:

- provider filter
- capability filter
- minimum context window
- maximum input price

Outputs:

- filtered model table
- sorted by context, input price, output price, or name
- model detail cards for selected comparisons

This tool should read exclusively from the registry and should not duplicate model facts.

## Related Tools

Phase 2 should introduce a simple related-tools mapping:

- Token Counter -> Cost Calculator, Context Visualizer, Text Chunker
- Cost Calculator -> Prompt Cache Calculator, Model Comparison, Token Counter
- Context Visualizer -> Token Counter, Text Chunker, Prompt Cache Calculator
- Prompt Diff -> Prompt Linter, Token Counter
- Prompt Linter -> Prompt Diff, Token Counter
- Schema Generator -> Tool Schema Converter, Output Validator
- Output Validator -> Schema Generator, Tool Schema Converter
- JSONL Viewer -> Text Chunker, Output Validator
- SSE Parser -> Model Comparison
- Model Comparison -> Cost Calculator, Prompt Cache Calculator

Only render links to tools present in `tools-data.ts`.

## Error Handling

- Invalid JSON should show a user-facing error and preserve input.
- Validation tools should report field paths rather than generic failure messages.
- Calculators should clamp numeric inputs to non-negative ranges.
- Tools should use empty-state messages instead of throwing on blank input.
- No empty `catch` blocks.

## Testing Strategy

Add tests under `src/__tests__/lib/llm/` for:

- context parsing and token summaries
- prompt cache cost math
- prompt variable extraction and diff summaries
- prompt linter rules and score bounds
- JSON schema generation from examples
- structured output validation failures and successes
- JSONL parse/edit/serialize helpers
- model comparison filters and sorting

UI tests are optional. Logic must be testable without rendering React.

## Verification

Phase 2 implementation is complete when these pass:

```bash
bun run lint
bun run typecheck
bun test
bun run build
```

## Risks

- Phase 2 is larger than Phase 1 in tool count and logic variety. Mitigation: implement shared pure modules first, then thin UI wrappers.
- Prompt linter rules can become subjective. Mitigation: make findings explainable, deterministic, and conservative.
- JSON Schema support can sprawl. Mitigation: explicitly support the practical subset needed by LLM structured outputs and document unsupported constructs.
- JSONL large-file support can become complex. Mitigation: start with paste-based parsing and avoid large-file claims.

## Open Decisions Resolved

- Phase 2 scope is all eight tools from `parsify.md`.
- Routes use `/ai/*`, matching Phase 1.
- Token counts remain approximate for this phase unless exact tokenizer integration is planned separately.
- No commits are created unless explicitly requested.
