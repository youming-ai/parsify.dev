# Repository Guidelines

## Project Structure & Module Organization
The repository is a PNPM workspace anchored by `package.json`. Source code lives in `apps/`: `apps/web` hosts the Next.js UI (pages, components, styles under `src/`), while `apps/api` contains the Cloudflare Workers API (entry in `src/index.ts`, functions exported from `functions/`). Generated output goes to `dist/` after a unified build, and reusable automation scripts sit in `scripts/`. Avoid committing build artefacts such as `dist/` or `out/`.

## Build, Test, and Development Commands
Run `pnpm setup` once to install workspace dependencies. Use `pnpm dev:web` for a fast Next.js-only loop, or `pnpm dev:unified` to build the web app, then run Pages + Workers together via Wrangler on http://localhost:8788. `pnpm build` or `pnpm deploy` execute the unified build script, which compiles the web bundle, copies Worker functions, and prepares Cloudflare-friendly redirects. Lint and format with `pnpm lint` and `pnpm format:write`; both rely on Biome.

## Coding Style & Naming Conventions
Follow Biome defaults: tab indentation (as in the existing sources), single quotes for JavaScript/TypeScript, trailing commas in ES5 positions, and mandatory semicolons. Organize imports automatically (`pnpm lint:fix`). Name React components and Zustand stores in PascalCase, hooks in `useX` camelCase, and Workers handlers in camelCase aligned with route purpose (e.g., `handleFormatterRequest`). Prefer TypeScript types over interfaces unless you need declaration merging.

## Testing Guidelines
Vitest powers API unit tests (`apps/api/src/*.test.ts`). Add new suites beside the code they exercise and name files `*.test.ts`. Ensure Workers logic that touches upstream services is wrapped in dependency-injected helpers so it can be stubbed. Trigger tests with `pnpm --filter @parsify/api vitest` (add `-u` to refresh snapshots when introduced). Target meaningful coverage on critical transforms (formatters, parsers); document gaps in PRs if full coverage is impractical.

## Commit & Pull Request Guidelines
Commits follow Conventional Commit prefixes (`feat:`, `refactor:`, `fix:`) as seen in recent history. Scope optional but encouraged (`feat(web): ...`). PRs should link issues, include a succinct summary, list manual test notes or Wrangler preview links, and attach UI screenshots when modifying the web app. Confirm `pnpm lint` passes before requesting review.
