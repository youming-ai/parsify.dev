<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Active Technologies
- TypeScript 5.0+ (strict mode), React 19+ + Next.js 16, Monaco Editor, Tailwind CSS, Zustand, Pyodide (Python WASM), TeaVM (Java WASM), WASM Go runtime, Web Crypto API (001-complete-dev-tools)
- Client-side localStorage for preferences, IndexedDB for temporary files, no backend storage (001-complete-dev-tools)

## Recent Changes
- 001-complete-dev-tools: Added TypeScript 5.0+ (strict mode), React 19+ + Next.js 16, Monaco Editor, Tailwind CSS, Zustand, Pyodide (Python WASM), TeaVM (Java WASM), WASM Go runtime, Web Crypto API
