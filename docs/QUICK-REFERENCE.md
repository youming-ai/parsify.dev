# Quick Reference Card

## Essential Commands

### Development
```bash
bun run dev          # Start dev server (http://localhost:3000)
bun run build        # Production build
bun run start        # Preview production build
bun run lint         # Check code quality
bun run format       # Format code
bun run typecheck    # TypeScript check
bun run test         # Run tests
```

### Deployment
```bash
bun run deploy               # Deploy to Cloudflare Workers
bunx wrangler secret put GROQ_API_KEY     # Set API key
bunx wrangler secret list                 # List all secrets
```

### Utilities
```bash
bun run clean        # Remove build artifacts
bun run test:coverage # Run tests with coverage
```

## Project Structure

```
parsify-dev/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes (AI, etc.)
│   │   ├── (routes)/     # Page routes
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── hooks/            # Custom hooks
├── docs/                 # Documentation
├── dist/                 # Build output (generated)
├── vite.config.ts        # Vite + vinext config
├── wrangler.toml         # Cloudflare Workers config
└── package.json          # Dependencies & scripts
```

## Environment Variables

### Production Secrets (via wrangler)
```bash
wrangler secret put GROQ_API_KEY
wrangler secret put ALLOWED_ORIGIN
```

### Development (.env.local)
```bash
GROQ_API_KEY=gsk_...
ALLOWED_ORIGIN=http://localhost:3000
```

## Key Files

| File | Purpose |
|------|---------|
| [vite.config.ts](../vite.config.ts) | Vite configuration |
| [wrangler.toml](../wrangler.toml) | Workers deployment |
| [next.config.ts](../next.config.ts) | Next.js settings |
| [package.json](../package.json) | Dependencies & scripts |

## Common Tasks

### Add a New Tool
1. Create component in `src/components/tools/`
2. Add route in `src/app/your-tool/page.tsx`
3. Update `src/data/tools-data.ts`

### Fix Build Error
```bash
rm -rf dist node_modules/.vite
bun run build
```

### Update Dependencies
```bash
bun update
bun audit
```

### Deploy to Staging
```bash
bun run deploy --env staging
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Clear cache: `rm -rf dist` |
| HMR not working | Restart dev server |
| Secret not loading | Use `wrangler secret put` |
| Type errors | Run `bun run typecheck` |

## Resources

- [Full Migration Guide](./VINEXT-MIGRATION.md)
- [Security Best Practices](./SECURITY.md)
- [vinext Docs](https://github.com/vinextjs/vinext)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
