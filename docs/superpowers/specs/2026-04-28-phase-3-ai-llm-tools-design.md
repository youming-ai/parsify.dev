# Phase 3 AI/LLM Tools Design

Date: 2026-04-28

Source plan: `parsify.md`

Depends on:

- `docs/superpowers/specs/2026-04-28-ai-llm-tools-pivot-design.md`
- `docs/superpowers/specs/2026-04-28-phase-2-ai-llm-tools-design.md`

## Summary

Phase 3 completes the browser-first AI/LLM tool suite by adding the remaining long-tail and commercial-readiness tools. It focuses on workflows that are useful for serious agent builders: rate-limit planning, prompt-format conversion, few-shot construction, variable filling, visual tool-schema building, fine-tuning dataset checks, embedding similarity exploration, and LLM API request construction.

Phase 3 covers eight tools:

- T5 Rate Limit Calculator
- P2 Prompt Format Converter
- P4 Few-shot Builder
- P5 Prompt Variable Filler
- S3 Tool Schema Builder
- R3 Fine-tuning Dataset Validator
- R4 Embedding Similarity Visualizer
- A3 LLM API Request Builder

A4 Provider Status is explicitly out of scope for this phase because full status aggregation requires backend or scheduled infrastructure. It can be handled in a later backend-specific spec.

## Goals

- Add eight Phase 3 tools under `/ai/*` using the existing Astro + React island architecture.
- Keep browser-first processing for all tools unless the user explicitly invokes a BYOK provider request.
- Build BYOK primitives for Phase 3 tools that need provider calls, especially embedding visualization and API request building.
- Keep pure transformation and validation logic under `src/lib/llm/` with Vitest coverage.
- Extend `src/data/tools-data.ts` so Phase 1, Phase 2, and Phase 3 tools are discoverable.
- Avoid new server infrastructure.

## Non-Goals

- Implement A4 Provider Status aggregation.
- Add user accounts, team sharing, billing, or Pro subscription flows.
- Persist API keys by default.
- Proxy provider requests through Parsify servers.
- Implement exact tokenizer WASM integration.
- Implement large-file streaming for fine-tuning datasets.

## Existing Foundation

The codebase already has:

- `/ai/*` route structure.
- 13 active AI/LLM tools from Phase 1 and Phase 2.
- shared components such as `ModelSelector`, `APIKeyInput`, `CodeExportTabs`, `MetricCard`, `JsonTextarea`, and `RelatedTools`.
- pure utilities under `src/lib/llm/` for registry, costs, chunking, SSE parsing, schema conversion, prompt analysis, JSONL parsing, and model comparison.
- `src/data/llm-registry.json` for model facts.

Phase 3 should extend these patterns and avoid creating a parallel component system.

## Route Scope

Add these routes:

```text
src/pages/ai/
├── rate-limit-calculator.astro
├── prompt-format-converter.astro
├── few-shot-builder.astro
├── prompt-variable-filler.astro
├── schema-builder.astro
├── finetuning-validator.astro
├── embedding-visualizer.astro
└── api-request-builder.astro
```

Each route uses Astro for metadata and hydrates a named React component with `client:load`.

## Tool Registry

Add Phase 3 tools to `src/data/tools-data.ts` using existing category `AI & LLM Tools` and these subcategories:

| Tool | Route | Subcategory |
|---|---|---|
| Rate Limit Calculator | `/ai/rate-limit-calculator` | Models & Providers |
| Prompt Format Converter | `/ai/prompt-format-converter` | Prompt Engineering |
| Few-shot Builder | `/ai/few-shot-builder` | Prompt Engineering |
| Prompt Variable Filler | `/ai/prompt-variable-filler` | Prompt Engineering |
| Tool Schema Builder | `/ai/schema-builder` | Tool Calling |
| Fine-tuning Dataset Validator | `/ai/finetuning-validator` | RAG & Data |
| Embedding Similarity Visualizer | `/ai/embedding-visualizer` | RAG & Data |
| LLM API Request Builder | `/ai/api-request-builder` | API Debugging |

## Shared Data And Utilities

Add focused pure modules under `src/lib/llm/`:

- `rate-limit-calculator.ts`: TPM/RPM/TPD/concurrency calculations.
- `prompt-format-converter.ts`: provider-neutral prompt IR plus provider serializers/parsers.
- `few-shot-builder.ts`: examples-to-prompt rendering in XML, JSON, Markdown, and plain text.
- `prompt-variable-filler.ts`: variable extraction, single fill, CSV-like batch fill, JSONL export.
- `schema-builder.ts`: form-style schema state to JSON Schema and provider tool formats.
- `finetuning-validator.ts`: JSONL dataset format checks, role sequence checks, token estimates, duplicate detection.
- `embedding-visualizer.ts`: cosine similarity, similarity matrix, and deterministic 2D projection fallback.
- `api-request-builder.ts`: provider request payload construction and code snippet generation.

Add browser-only provider call helpers only where needed:

- `provider-client.ts`: direct browser fetch helpers for BYOK requests, with no Parsify proxy.

`provider-client.ts` must not be used by tests that require real provider calls. Tests should cover request construction, not live network calls.

## Shared Components

Reuse existing shared components first. Add new shared components only if they are used by two or more tools:

- `ProviderSelector`: choose OpenAI, Anthropic, Google, or compatible provider.
- `SchemaFieldEditor`: reusable row for schema-builder parameters.
- `PromptExampleEditor`: reusable editor for few-shot input/output examples.
- `BYOKNotice`: small privacy explanation for direct browser provider calls.

Avoid creating a package-like abstraction. Keep shared components under `src/components/tools/ai/shared/`.

## BYOK Privacy Rules

- API keys are held in component state by default.
- API key persistence is opt-in only and can be omitted in the first implementation.
- Provider requests go directly from the browser to the provider endpoint.
- UI must state that Parsify does not receive the key or request body.
- Clear errors should explain CORS/provider limitations if browser direct calls fail.

## Tool Designs

### T5 Rate Limit Calculator

Purpose: help developers estimate throughput and bottlenecks from TPM, RPM, TPD, average input/output tokens, and concurrency.

Inputs:

- TPM
- RPM
- TPD
- max concurrency
- average input tokens
- average output tokens
- desired requests per second

Outputs:

- max requests per minute by tokens
- max requests per minute by request limit
- max sustained requests per second
- daily request capacity
- bottleneck label: TPM, RPM, TPD, or concurrency
- recommendation text

### P2 Prompt Format Converter

Purpose: convert prompts across provider formats.

Initial formats:

- OpenAI messages array
- Anthropic top-level `system` plus `messages`
- Gemini `contents`
- ChatML text
- Parsify prompt IR

Outputs:

- provider payload JSON for OpenAI, Anthropic, and Gemini
- ChatML text
- curl/fetch/TypeScript examples where practical

The IR is the source of truth internally:

```json
{
  "version": "1.0",
  "system": "...",
  "messages": [{ "role": "user", "content": "..." }],
  "tools": []
}
```

### P4 Few-shot Builder

Purpose: generate structured few-shot prompt blocks from a task description and input/output examples.

Inputs:

- task description
- examples array: input, output, optional note
- output style: XML, JSON, Markdown, plain text

Outputs:

- rendered prompt
- estimated token count
- example count and recommendation text

### P5 Prompt Variable Filler

Purpose: extract variables from prompt templates and generate filled prompts, including batch JSONL export.

Supported variables:

- `{{var}}`
- `{var}`
- `${var}`

Inputs:

- prompt template
- variable values
- optional CSV-like rows for batch mode

Outputs:

- filled prompt
- missing variable list
- batch JSONL export where each line contains `{ "prompt": "...", "variables": { ... } }`

### S3 Tool Schema Builder

Purpose: visually build an LLM tool/function schema.

Inputs:

- tool name
- tool description
- parameter rows: name, type, required, description, enum values

Outputs:

- JSON Schema
- OpenAI tool format
- Anthropic tool format
- Gemini function declaration
- MCP tool shape

Nested objects and arrays can be represented in a simple first implementation through `type: object` and `type: array` rows with description hints. Deep nested visual editing is out of scope for this pass.

### R3 Fine-tuning Dataset Validator

Purpose: check JSONL datasets intended for fine-tuning or batch testing.

Initial supported format:

- OpenAI-style records with `messages: [{ role, content }]`.

Outputs:

- record count
- valid/invalid count
- role sequence warnings
- estimated token distribution
- duplicate record count based on normalized JSON string
- cleaned JSONL export containing valid records only

Anthropic and Gemini-specific fine-tuning formats are later enhancements.

### R4 Embedding Similarity Visualizer

Purpose: compare text similarity using embeddings.

Initial modes:

- Manual vector mode: paste text labels and numeric vectors.
- BYOK embedding mode: call provider embeddings directly from the browser where CORS permits.

Outputs:

- cosine similarity matrix
- nearest neighbor per item
- simple deterministic 2D projection for display

The initial implementation can use manual vectors as the reliable core. BYOK request construction and direct fetch are included, but UI must handle browser/provider failures gracefully.

### A3 LLM API Request Builder

Purpose: construct provider-specific API requests and code examples for LLM calls.

Inputs:

- provider
- model
- system prompt
- user prompt
- temperature
- max output tokens
- optional tools JSON
- optional API key for direct send

Outputs:

- provider request payload
- curl example
- fetch/TypeScript example
- optional direct browser request result or error

Direct send must be clearly marked as BYOK and browser-direct.

## Related Tools

Extend related tools with Phase 3 links:

- Rate Limit Calculator -> Model Comparison, API Request Builder
- Prompt Format Converter -> Tool Schema Converter, API Request Builder, Prompt Diff
- Few-shot Builder -> Prompt Linter, Prompt Variable Filler, Token Counter
- Prompt Variable Filler -> Few-shot Builder, Prompt Diff, API Request Builder
- Tool Schema Builder -> Tool Schema Converter, Schema Generator, Output Validator
- Fine-tuning Validator -> JSONL Viewer, Token Counter, Cost Calculator
- Embedding Visualizer -> API Request Builder, Model Comparison
- API Request Builder -> Prompt Format Converter, Tool Schema Builder, SSE Parser

Only render links to registered tools.

## Error Handling

- Numeric calculators clamp invalid values to safe non-negative ranges.
- JSON tools preserve input and show parse errors.
- BYOK tools show network, CORS, and provider errors without swallowing exceptions.
- Batch tools report row-level errors.
- No empty `catch` blocks.

## Testing Strategy

Add tests under `src/__tests__/lib/llm/` for:

- rate-limit calculations
- prompt IR parsing and provider serialization
- few-shot rendering
- variable extraction and batch filling
- schema-builder output shapes
- fine-tuning JSONL validation
- cosine similarity and matrix generation
- API request payload and code generation

No tests should call live provider APIs.

## Verification

Phase 3 implementation is complete when these pass:

```bash
bun run lint
bun run typecheck
bun test
bun run build
```

## Risks

- Phase 3 includes BYOK tools that may hit provider CORS limitations. Mitigation: make request generation useful even when direct send fails.
- Prompt format conversion can sprawl. Mitigation: use a small Parsify IR and provider serializers.
- Schema builder can become complex. Mitigation: flat parameter rows for the first implementation.
- Embedding visualizer can become ML-heavy. Mitigation: deterministic cosine similarity and simple projection; no UMAP/t-SNE dependency in this pass.

## Open Decisions Resolved

- A4 Provider Status is skipped for now.
- Phase 3 remains `/ai/*` and browser-first.
- BYOK means direct browser-to-provider calls only.
- No commits are created unless explicitly requested.
