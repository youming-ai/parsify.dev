# Parsify

### Your Files Never Leave Your Device

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🌐 **Live**: [parsify.dev](https://parsify.dev)

On-device OCR powered by PaddleOCR PP-OCRv6. Extract text from images and PDFs — files stay in your browser. Optional AI cleanup sends only extracted text when you request it.

## 🚀 Quick start

### Prerequisites

- **Bun** ≥ 1.3
- An **LLM API key** (for optional AI cleanup only — OCR works without it)

### Install & run

```bash
git clone https://github.com/youming-ai/parsify.dev.git
cd parsify.dev
bun install
cp .env.example .env
# Fill in LLM_API_KEY for optional AI cleanup
bun run dev
```

Open http://localhost:5173.

## 🏗️ Tech stack

- **OCR**: PaddleOCR PP-OCRv6 via ONNX Runtime Web (WASM) — runs entirely in-browser
- **Framework**: React 19 + TanStack Router
- **API layer**: Hono v4 mounted at `/api/*`
- **AI cleanup**: LLM-powered text correction via `/api/enhance` (opt-in, sends only extracted text)
- **Validation**: Zod 4
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Testing**: Bun test runner
- **Linting**: Biome v2
- **Logging**: pino + hono-pino
- **Build**: Vite 7
- **Runtime**: Bun (Node ≥ 20 also supported)
- **Deploy**: Dokploy + Docker

## 🔒 Privacy

- **OCR runs in-browser.** Source files never leave your device — all processing happens locally via WASM.
- **AI cleanup is opt-in.** When triggered, only the extracted text is sent to the server — never your source files.
- **API keys live only on the server.** `LLM_API_KEY` comes from `process.env` and is never sent from the browser, logged, or persisted.
- **Rate limiting** on `/api/enhance` (20 req / 60 per IP) caps API key usage.

## 📄 License

MIT — see [LICENSE](LICENSE).

