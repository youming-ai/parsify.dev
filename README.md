# Parsify.dev

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Astro](https://img.shields.io/badge/Astro-5.x-purple.svg)](https://astro.build/)

**AI & LLM Developer Tools** — Privacy-first browser utilities for AI agent and LLM application developers.

🌐 **Live**: [parsify.dev](https://parsify.dev)

## ✨ Tools

### Tokens & Cost
- **Multi-Model Token Counter** — compare token counts across providers
- **LLM Cost Calculator** — estimate monthly API spend with batch + cache pricing
- **Prompt Cache Calculator** — quantify whether prompt caching pays off

### Models & Providers
- **Rate Limit Calculator** — derive throughput from TPM / RPM / TPD / concurrency

### API Debugging
- **LLM SSE Stream Parser** — parse and inspect raw streaming responses

### Tool Calling
- **Tool Schema Converter** — convert function-calling schemas between OpenAI, Anthropic, Gemini, MCP

### RAG & Data
- **JSONL Viewer / Editor** — inspect, validate, edit, and export JSONL datasets in your browser

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
- **Testing**: Vitest (node env, 18 tests)
- **Linting**: Biome
- **Deployment**: Cloudflare Pages (static, Git integration)

## 📁 Project Structure

```
src/
├── pages/ai/             # Astro route shells (SEO + island mount)
├── components/tools/ai/  # React tool implementations
├── lib/llm/              # Pure logic modules (calculators, parsers, JSONL)
├── data/                 # Tool registry + LLM model facts
├── types/                # Shared TypeScript interfaces
└── __tests__/lib/llm/    # Vitest tests
```

## 🔒 Privacy

All tools run **100% client-side**. Prompts, API keys, schemas, and datasets never leave your browser. Provider calls (where supported) go browser-direct via your own API key — Parsify never receives your credentials or request body.

## 📄 License

MIT License — see [LICENSE](LICENSE)
