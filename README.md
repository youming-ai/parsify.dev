# Parsify.dev

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![vinext](https://img.shields.io/badge/vinext-Vite%20%2B%20Next.js-blue.svg)](https://github.com/vinextjs/vinext)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)

**Essential Tools for Developers** - Privacy-first utilities running entirely in your browser.

🌐 **Live**: [parsify.dev](https://parsify.dev)

## ✨ Features

### 🔧 Data Format & Conversion
- JSON Tools (format, validate, transform)
- Base64 Encoder/Decoder
- HTML/Markdown Editor
- SQL Formatter

### 🔐 Security & Authentication
- Hash Generator (MD5, SHA-256, etc.)
- JWT Decoder
- Password Generator
- Key Pair Generator

### 💻 Development & Testing
- Diff Viewer
- ID Generator (UUID, ULID, etc.)
- Regex Validator
- Lorem Ipsum Generator

### 🌐 Network & Web
- URL Parser
- DNS Lookup

### 🛠️ Utility
- Timestamp Converter
- Color Tools
- Cron Expression Parser

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20
- **Bun** >= 1.3 (recommended) or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/youming-ai/parsify.dev.git
cd parsify.dev

# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production + Cloudflare |
| `bun run start` | Start production server |
| `bun run deploy` | Deploy to Cloudflare Workers |
| `bun run deploy:cf` | Build and deploy to Cloudflare |
| `bun run clean` | Clean build artifacts |

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router) via **vinext** (Vite-based)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React hooks (useState, useMemo)
- **Testing**: Vitest + happy-dom
- **Linting**: Biome
- **Build**: Vite + vinext
- **Deployment**: Cloudflare Workers

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── layout/       # Layout components
│   ├── tools/        # Tool-specific components
│   └── ui/           # shadcn/ui components
├── lib/              # Utilities and helpers
├── data/             # Static data (tools-data.ts)
└── types/            # TypeScript types
```

## 🌐 Deployment

### Cloudflare Workers

```bash
# Login to Cloudflare
bunx wrangler login

# Build and deploy
bun run deploy

# Or deploy to staging
bun run deploy --env staging
```

### Environment Variables

Set secrets via Wrangler:

```bash
# For AI API route
bunx wrangler secret put GROQ_API_KEY

# Set allowed origin
bunx wrangler secret put ALLOWED_ORIGIN
```

See [wrangler.toml](wrangler.toml) for configuration.

## 📚 Documentation

- [vinext Migration Guide](docs/VINEXT-MIGRATION.md) - How we migrated to vinext
- [Security Best Practices](docs/SECURITY.md) - Security considerations and guidelines

## 🔒 Privacy

All tools run **100% client-side**. Your data never leaves your browser.

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

**Built with ❤️ for developers**
