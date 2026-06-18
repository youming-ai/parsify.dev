# Task 2 Report

- **Status:** DONE
- **Commits:** `85a2d32 feat: dynamically import OcrEngine and home page`
- **What was implemented:**
  1. Replaced static imports of `OcrEngine` and `renderPdfPages` in `src/routes/index.tsx` with type-only import `import type { OcrEngine }`.
  2. Changed global `engine` declaration to a mutable `let engine: OcrEngine | null = null;`.
  3. Updated `ensureModels` to dynamically import `~/lib/ocr/engine` and instantiate `OcrEngine` on first run, returning the instantiated engine.
  4. Updated PDF rendering flow to dynamically import `~/lib/ocr/pdf-renderer` when a PDF file is processed.
  5. Updated both PDF and image processing flows to retrieve the loaded engine and use it.
- **Verification:**
  - `bun run typecheck` passes cleanly.
  - `bun run lint` passes cleanly.
- **Concerns:** None.
