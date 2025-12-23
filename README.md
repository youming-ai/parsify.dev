# Parsify.dev

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange.svg)](https://pages.cloudflare.com/)

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
- Cron Job Generator

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
| `bun run build` | Build for production |
| `bun run build:cf` | Build for Cloudflare |
| `bun run deploy:cf` | Deploy to Cloudflare Pages |
| `bun run lint` | Run linter |
| `bun run type-check` | TypeScript type check |
| `bun run test` | Run tests |

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + shadcn/ui
- **Editor**: Monaco Editor
- **State**: Zustand
- **Deployment**: Cloudflare Pages

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

### Cloudflare Pages (Recommended)

```bash
# Login to Cloudflare
npx wrangler login

# Build and deploy
bun run build:cf
bun run deploy:cf
```

See [docs/CLOUDFLARE-DEPLOY.md](docs/CLOUDFLARE-DEPLOY.md) for detailed instructions.

## 📚 Documentation

- [Cloudflare Deployment](docs/CLOUDFLARE-DEPLOY.md)
- [Design System](docs/DESIGN_SYSTEM.md)

## 🔒 Privacy

All tools run **100% client-side**. Your data never leaves your browser.

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

**Built with ❤️ for developers**
