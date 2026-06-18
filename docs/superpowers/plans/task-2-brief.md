# Task 2: Code-split OCR and PDF rendering libraries

**Goal:** Modify `src/routes/index.tsx` to dynamically import `OcrEngine` and `renderPdfPages` to significantly reduce initial JavaScript bundle size.

**Files:**
- Modify: `src/routes/index.tsx`

## Requirements:
1. Replace the static imports of `OcrEngine` and `renderPdfPages` with type-only imports or dynamic imports.
2. Store the `OcrEngine` instance in a module-level variable that is lazily initialized when needed.
3. Import `renderPdfPages` dynamically when rendering a PDF.
4. Verify types and ensure the code compiles without errors.
