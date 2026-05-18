# Parsify.dev

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Paste a URL. Get clean, structured content — instantly ready for your AI.**

🌐 **Live**: [parsify.dev](https://parsify.dev)

Parsify takes any URL, fetches and cleans it via [Jina Reader](https://jina.ai/reader/), and runs a DeepSeek agent on the result to produce a summary. The user's prompt also narrows extraction (`X-Instruction`) so the model only sees content relevant to the question — dramatically fewer tokens than feeding raw HTML.

## 🚀 Quick start

### Prerequisites

- **Bun** ≥ 1.3
- A **DeepSeek** API key (https://platform.deepseek.com/api_keys) — required
- A **Jina Reader** API key (https://jina.ai/api-dashboard) — optional, raises rate limit from 20 → 500 RPM

### Install & run

```bash
git clone https://github.com/youming-ai/parsify.dev.git
cd parsify.dev
bun install
cp .env.example .env
# Fill in DEEPSEEK_API_KEY and (optionally) JINA_API_KEY
bun run dev
```

Open http://localhost:3000.

## 🏗️ Tech stack

- **Framework**: TanStack Start v1 (full SSR) + TanStack Router + React 19
- **API layer**: Hono v4 mounted at `/api/*`
- **Validation**: Zod 4
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Testing**: Bun test runner
- **Linting**: Biome v2
- **Logging**: pino + hono-pino
- **Build**: Vite 7
- **Runtime**: Bun (Node ≥ 20 also supported)
- **Deploy**: Dokploy + Docker

## 📁 Project structure

```
src/
├── routes/                  # TanStack Router file-based routes
│   ├── __root.tsx           # HTML shell + theme bootstrap
│   ├── index.tsx            # Hero + URL form + results + features
│   └── api/$.ts             # Hono catch-all
├── server/
│   ├── hono.ts              # Hono app (CORS, pino, rate-limit)
│   └── routers/
│       ├── parse.ts         # POST /api/parse → Jina Reader
│       └── agent.ts         # POST /api/agent → DeepSeek SSE proxy
├── schemas/                 # Zod request/response schemas (SSRF guard lives here)
├── components/parser/       # URL form, markdown output, agent output, stats
├── components/ui/           # shadcn/ui primitives
└── lib/parser/              # token estimator + React hooks
```

## 🔒 Security

- **API keys live only on the server.** `DEEPSEEK_API_KEY` / `JINA_API_KEY` come from `process.env` and are never sent from the browser, logged, or persisted.
- **SSRF guard** in `parseRequestSchema` rejects loopback / private / link-local hosts.
- **Rate limiting** on `/api/agent` (20 req / 15 min per IP) caps DeepSeek-key abuse.
- pino redacts `*.apiKey`, `*.headers.authorization`, `*.headers.cookie` as defense in depth.

## 📄 License

MIT — see [LICENSE](LICENSE).
