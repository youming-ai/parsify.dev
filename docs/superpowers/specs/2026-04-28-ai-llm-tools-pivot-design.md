# AI/LLM Tools Pivot Design

Date: 2026-04-28

Source plan: `parsify.md`

## Summary

Parsify.dev will pivot from a general-purpose developer tools site into a focused AI agent / LLM application developer tools site.

This is not an additive expansion. Existing general developer tools will be removed. The site will keep its Astro, React island, Tailwind, shadcn-style UI, SEO, and Cloudflare deployment foundations, but the public product surface will become AI/LLM-only.

The first implementation target is Phase 1 infrastructure plus the route and registry foundation for the first five high-value AI/LLM tools.

## Goals

- Reposition the site around AI agent and LLM developer workflows.
- Preserve the privacy-first positioning: browser-side processing whenever possible, no account, no installation.
- Use a single maintained LLM registry as the source of truth for model pricing, context limits, capabilities, and tokenizer metadata.
- Establish an Astro-native route and component structure for AI/LLM tools.
- Remove obsolete general-tool routes, registry entries, and tool components from the public product surface.
- Create a foundation that supports the full 18-tool roadmap in `parsify.md`.

## Non-Goals

- Implement all 18 tools in this first pass.
- Add server-side LLM processing.
- Add accounts, analytics tied to user input, or backend persistence.
- Build Pro subscription flows.
- Preserve old URLs for compatibility. The user has explicitly approved removing previous tools.

## Current Codebase Reality

The repository is now Astro-based, despite older project instructions referencing Next.js.

- Framework: Astro 5 with React 19 islands.
- Routes: `src/pages/{category}/{tool}.astro`.
- React tool implementations: `src/components/tools/**`.
- UI primitives: `src/components/ui/**`.
- Deployment: Cloudflare Workers via `@astrojs/cloudflare`.

The design adapts `parsify.md` from its original Next.js assumptions into the current Astro architecture.

## Product Scope

The new product surface is:

- Home page `/`: AI/LLM developer tools landing page.
- AI category page `/ai/`: overview of all AI/LLM tools.
- Phase 1 tool pages:
  - `/ai/token-counter`
  - `/ai/cost-calculator`
  - `/ai/tool-schema-converter`
  - `/ai/text-chunker`
  - `/ai/sse-parser`

The full roadmap remains 18 tools from `parsify.md`, organized internally by workflow rather than by old categories.

## Removed Public Surface

The previous general developer tool categories will be removed from the public site:

- `/data-format/*`
- `/security/*`
- `/development/*`
- `/network/*`

The old tool registry entries will be replaced with AI/LLM tool entries. Old tool-specific React components, pages, tests, and libraries can be deleted when no longer referenced by the new site.

Reusable infrastructure should remain:

- `src/components/ui/**`
- shared layout components that still fit the new site
- `src/lib/utils.ts`
- SEO and structured data helpers that still compile and serve the new pages
- Tailwind, Biome, Vitest, Astro, Cloudflare, and React setup

## Route Architecture

Astro route files will be used for SEO, metadata, and page composition. React components will provide interactive tool behavior through Astro islands.

Target structure:

```text
src/pages/
├── index.astro
└── ai/
    ├── index.astro
    ├── token-counter.astro
    ├── cost-calculator.astro
    ├── tool-schema-converter.astro
    ├── text-chunker.astro
    └── sse-parser.astro
```

Each tool route should import a React component with `client:load` or a more conservative hydration directive if the tool does not need immediate interactivity.

## Component Architecture

AI/LLM tool components will live under:

```text
src/components/tools/ai/
├── token-counter.tsx
├── cost-calculator.tsx
├── tool-schema-converter.tsx
├── text-chunker.tsx
├── sse-parser.tsx
└── shared/
    ├── model-selector.tsx
    ├── token-counter-bar.tsx
    ├── api-key-input.tsx
    └── code-export-tabs.tsx
```

Shared components should use existing UI primitives from `src/components/ui/` before introducing new UI building blocks.

### Shared Components

`ModelSelector` filters and selects models from the registry by provider, capabilities, and price-relevant metadata.

`TokenCounterBar` presents token counts and estimated cost for a model or selected models. Initial implementation can use approximate token counting until tokenizer integrations are added.

`APIKeyInput` supports BYOK tools. Keys must not leave the browser except when the user explicitly sends a provider request from a BYOK tool. If storage is implemented, it must be opt-in and clearly explained.

`CodeExportTabs` renders generated examples such as curl, Python, TypeScript, and fetch snippets.

## Data Architecture

The LLM registry is the central source of truth:

```text
src/data/llm-registry.json
```

It stores model metadata needed across tools:

- provider
- display name
- context window
- max output tokens
- input and output pricing
- cache pricing where applicable
- batch discount metadata where applicable
- supported capabilities
- tokenizer family
- knowledge cutoff
- maintenance metadata

Types will live in:

```text
src/types/llm.ts
```

The registry should start with a practical subset of current mainstream models across OpenAI, Anthropic, Google, Meta, DeepSeek, Qwen, and Mistral. Accuracy and maintainability are more important than exhaustive coverage.

## Tool Registry

`src/data/tools-data.ts` will be rewritten around AI/LLM tools.

The new registry should include all roadmap tools so the category page, home page, and related-tools sections can work before every tool is implemented. Tools not yet implemented can be marked as planned or omitted from navigable UI, depending on the existing registry type constraints.

Phase 1 tools should be active and routed:

- Multi-Model Token Counter
- LLM Cost Calculator
- Tool Schema Converter
- Token-Aware Text Chunker
- SSE Stream Parser

## Phase 1 Tool Boundaries

### Token Counter

Initial purpose: paste text and compare approximate or tokenizer-backed counts across selected models.

The complete roadmap includes token boundary visualization, role-based counting, multilingual and emoji support, and JSON export. The infrastructure pass may scaffold the page and shared utilities before full tokenizer integration.

### Cost Calculator

Initial purpose: calculate monthly cost from request volume, average input tokens, average output tokens, cache assumptions, and selected models.

It reads prices from `llm-registry.json`.

### Tool Schema Converter

Initial purpose: convert a provider-neutral tool schema into OpenAI, Anthropic, Gemini, and MCP representations.

The converter should be implemented as pure functions under `src/lib/llm/` when built, with component UI as a thin layer.

### Text Chunker

Initial purpose: split pasted text into chunks with configurable chunk size and overlap, then display chunk metadata and JSONL export.

PDF support and advanced semantic splitting are later enhancements.

### SSE Parser

Initial purpose: parse pasted Server-Sent Events text, show events, accumulated text deltas, usage metadata, errors, and provider-specific fields.

Replay mode is a later enhancement if needed.

## Privacy And Security

- All user text, prompts, schemas, and logs must be processed in the browser unless the user explicitly invokes a BYOK provider request.
- No server-side processing of pasted user content for Phase 1 tools.
- API keys must never be sent to Parsify infrastructure.
- Avoid `dangerouslySetInnerHTML` for user content.
- Any persisted local data must be clearly user-controlled and removable.

## SEO And Internal Linking

Every tool keeps the one-tool-one-page strategy.

Each Phase 1 page needs:

- descriptive title
- focused meta description
- canonical URL
- JSON-LD where supported by existing helpers
- related tools section

The related-tools graph starts with the recommendations in `parsify.md`:

- Token Counter -> Cost Calculator, Context Visualizer, Text Chunker
- Text Chunker -> Token Counter, Context Visualizer, JSONL Viewer
- Tool Schema Converter -> JSON Schema Generator, Structured Output Validator, Prompt Format Converter
- SSE Parser -> Model Comparison, API Request Builder

For not-yet-built tools, related links should either point only to active pages or render planned labels without dead links.

## Testing Strategy

Tests should focus on pure logic:

- registry type validation helpers
- cost calculation math
- schema conversion functions
- text chunking functions
- SSE parsing functions

UI tests are optional unless existing patterns make them cheap. The implementation should keep business logic outside React components where possible.

## Verification

After implementation changes:

- `bun run lint`
- `bun run typecheck`
- `bun test`

If old tests are deleted because old tools are removed, the remaining suite must still pass and cover new LLM utility logic.

## Risks

- Registry data can become stale. Mitigation: keep registry compact initially and document maintenance fields.
- Tokenizer packages can inflate client bundles. Mitigation: lazy load tokenizer-specific code and allow approximate fallback where acceptable.
- Removing old tools may leave broken imports or stale SEO mappings. Mitigation: remove incrementally and run typecheck after each major cleanup.
- `parsify.md` references `/llm/*`, while this design chooses `/ai/*`. Mitigation: use `/ai/*` because the user approved the earlier design and it is shorter, product-oriented, and compatible with AI agent positioning.

## Open Decisions Resolved

- The old tools will not be retained.
- The current Astro architecture is authoritative over stale Next.js references.
- The initial public route prefix is `/ai/`.
- Specs and plans should be created in the repository.
- Git commits are not created unless explicitly requested.
