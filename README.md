# Parsify.dev

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Astro](https://img.shields.io/badge/Astro-5.x-purple.svg)](https://astro.build/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)

**AI & LLM Developer Tools** — Privacy-first browser utilities for AI agent and LLM application developers.

🌐 **Live**: [parsify.dev](https://parsify.dev)

## ✨ Tools

### Tokens & Cost
- Multi-Model Token Counter — compare token counts across providers
- LLM Cost Calculator — estimate monthly API spend
- Context Window Visualizer — visualize prompt context usage
- Prompt Cache Calculator — calculate cache savings

### Prompt Engineering
- Prompt Diff — compare prompt versions with token delta
- System Prompt Linter — analyze prompt quality with rule-based checks
- Prompt Format Converter — convert between OpenAI, Anthropic, Gemini, ChatML
- Few-shot Builder — generate structured few-shot prompts
- Prompt Variable Filler — fill templates and export batch prompts

### Tool Calling
- Tool Schema Converter — convert schemas across provider formats
- LLM JSON Schema Generator — generate schemas from JSON examples
- Structured Output Validator — validate LLM output against schemas
- Tool Schema Builder — build schemas with visual parameter forms

### RAG & Data
- Token-Aware Text Chunker — split text into RAG-ready chunks
- JSONL Viewer / Editor — inspect and edit JSONL datasets
- Fine-tuning Dataset Validator — check dataset quality
- Embedding Similarity Visualizer — compare embedding vectors

### API Debugging
- LLM SSE Stream Parser — parse streaming responses
- LLM API Request Builder — build and test API calls
- Rate Limit Calculator — calculate API throughput limits

### Models & Providers
- Model Comparison Table — filter and compare LLM models

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20
- **Bun** >= 1.3 (required)

### Installation

```bash
git clone https://github.com/youming-ai/parsify.dev.git
cd parsify.dev
bun install
bun run dev
```

## 🏗️ Tech Stack

- **Framework**: Astro 5 + React 19 islands
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 3 + shadcn/ui
- **Testing**: Vitest + happy-dom (78 tests)
- **Linting**: Biome
- **Deployment**: Cloudflare Workers (@astrojs/cloudflare)

## 📁 Project Structure

```
src/
├── pages/ai/         # Astro route shells (SEO + island mount)
├── components/tools/ai/  # React tool implementations
├── lib/llm/          # Pure logic modules (calculators, parsers, validators)
├── data/             # Tool registry + LLM model facts
├── types/            # Shared TypeScript interfaces
└── __tests__/lib/llm/  # Vitest tests
```

## 🔒 Privacy

All tools run **100% client-side**. Prompts, API keys, schemas, and datasets never leave your browser. Provider calls (where supported) go browser-direct via your own API key — Parsify never receives your credentials or request body.

## 📄 License

MIT License — see [LICENSE](LICENSE)
