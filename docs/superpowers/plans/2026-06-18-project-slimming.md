# Project Slimming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Slim down the project by removing unused dependencies, untracking generated third-party files from Git, and optimizing the client-side JavaScript bundle via dynamic imports (code-splitting).

**Architecture:** Remove `@tanstack/react-router-devtools` from dependencies. Add generated third-party files (`public/pdf.worker.min.mjs` and the `public/ort/` directory) to `.gitignore` and untrack them. In the client, dynamically import `OcrEngine` and `renderPdfPages` inside the `handleImageSelect` callback to split `onnxruntime-web` and `pdfjs-dist` into separate async chunks.

**Tech Stack:** Bun, Vite, TanStack Router, React

## Global Constraints

- Biome checks and typescript compilation must pass with zero errors.
- Do not check generated wasm or worker assets into git; they are generated on `postinstall`.
- All tests must pass.

---

## Task 1: Clean up dependencies and ignore generated assets

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Remove `@tanstack/react-router-devtools` and format package.json**

Run: `bun remove @tanstack/react-router-devtools`
Expected: dependency removed, `package.json` updated.

- [ ] **Step 2: Add generated assets to `.gitignore`**

Update `.gitignore` to include:
```
# Generated assets
public/pdf.worker.min.mjs
public/ort/
```

- [ ] **Step 3: Untrack the generated assets from Git**

Run: `git rm --cached public/pdf.worker.min.mjs public/ort/ort-wasm-simd-threaded.mjs public/ort/ort-wasm-simd-threaded.wasm`
Expected: files removed from git index but kept on disk.

- [ ] **Step 4: Commit changes**

Run:
```bash
git add package.json .gitignore
git commit -m "chore: remove unused devtools and ignore generated assets"
```

---

## Task 2: Code-split OCR and PDF rendering libraries

**Files:**
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Modify `src/routes/index.tsx` to use dynamic imports for OCR engine and PDF renderer**

Change imports and state initialization so that `OcrEngine` and `renderPdfPages` are imported dynamically.

Original imports:
```typescript
import { OcrEngine } from '~/lib/ocr/engine';
import { renderPdfPages } from '~/lib/ocr/pdf-renderer';
```

Modified imports:
```typescript
import type { OcrEngine } from '~/lib/ocr/engine';
```

Introduce module-level state for the engine:
```typescript
let engine: OcrEngine | null = null;
```

Update `handleImageSelect` and `ensureModels` to load the modules on-demand.

- [ ] **Step 2: Run build to verify bundle split**

Run: `bun run build`
Expected: A successful build. The main client bundle (`dist/client/assets/index-*.js`) size should be significantly smaller (around ~150-200kB instead of ~1.18MB), with new chunks generated for `onnxruntime-web` and `pdfjs-dist`.

- [ ] **Step 3: Run Biome linting and typechecking**

Run: `bun run lint && bun run typecheck`
Expected: Zero linting errors and zero TypeScript compile errors.

- [ ] **Step 4: Commit changes**

Run:
```bash
git add src/routes/index.tsx
git commit -m "perf: code-split ocr and pdf renderer for smaller client bundle"
```

---

## Task 3: Verify tests and run final sanity check

**Files:**
- Test: Run the test suite

- [ ] **Step 1: Run project tests**

Run: `bun test`
Expected: All tests pass.

- [ ] **Step 2: Check git status to ensure only expected files are tracked**

Run: `git status`
Expected: The untracked files deleted from git show as deleted/untracked properly, and working tree is clean.
