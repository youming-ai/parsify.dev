# Parsify OCR — Browser-Local OCR + Server-Side LLM Enhancement

**Date**: 2026-06-17
**Status**: Approved
**Scope**: Complete pivot from SEO analysis tool to OCR recognition tool

## Overview

Parsify transforms from an SEO analysis tool (URL → Jina Reader → DeepSeek → SEO report) into a browser-local OCR recognition tool powered by PaddleOCR PP-OCRv6 Tiny. OCR inference runs entirely in the user's browser via ONNX Runtime Web, with an optional server-side LLM endpoint for text correction and structured extraction.

## Architecture

```
Browser (React SPA)
┌─────────────────────────────────────────────┐
│                                             │
│  Image Upload ──→ ONNX Runtime Web          │
│  (drag/paste/       │                       │
│   file picker)      │ PP-OCRv6 Tiny         │
│                     │ (det → cls → rec)     │
│                     ▼                       │
│               OCR Raw Text                  │
│               (with boxes + confidence)     │
│                     │                       │
│                     ▼                       │
│            POST /api/enhance                │
│                     │                       │
└─────────────────────┼───────────────────────┘
                      ▼
              Hono Server (Cloudflare Workers)
              LLM post-processing
              (text correction, structuring)
```

**Data flow:**
1. User uploads image (drag & drop / paste / file picker / camera)
2. Browser runs PP-OCRv6 Tiny via ONNX Runtime Web (WASM backend)
3. Three-stage pipeline: text detection → direction classification → text recognition
4. Outputs raw OCR text with bounding boxes and confidence scores
5. Raw text sent to `/api/enhance` for LLM post-processing
6. Enhanced result streamed back and displayed to user

## Browser-Side OCR Engine

### Runtime

- **Engine**: `onnxruntime-web` v1.21+ with WASM backend (SIMD acceleration)
- **Models**: 3 ONNX models from PP-OCRv6 Tiny (~1.5MB total)
  - `det` (text detection) — identifies text regions in image
  - `cls` (text direction classification) — determines text orientation (0°/180°)
  - `rec` (text recognition) — converts text region images to strings
- **Model source**: Exported from PaddleOCR to ONNX format, hosted at `public/models/pp-ocrv6-tiny/`

### Model Loading

- First visit: download models from CDN, cache in IndexedDB
- Subsequent visits: load directly from IndexedDB (offline capable)
- Progressive loading: load `det` first (can start detection), then `cls` + `rec` in parallel

### Image Preprocessing

- Canvas API for image decoding and resize
- Normalize pixel values to model input format
- Handle orientation via EXIF data
- Max input dimension: 960px (longest side), maintain aspect ratio

### Post-processing

- **Detection**: DBNet output → polygon extraction → NMS → text bounding boxes
- **Classification**: argmax on output logits → rotate 180° boxes if needed
- **Recognition**: CTC decoding → character sequence → text string
- Output: array of `{ text, confidence, box: number[][] }`

## Server-Side API (Hono)

### Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check: `{ ok: true }` (kept) |
| `/api/enhance` | POST | LLM post-processing of OCR text (new) |
| `/api/llm.txt` | GET | LLM description (kept) |
| `/api/robots.txt` | GET | Crawler instructions (kept) |
| `/api/sitemap.xml` | GET | XML sitemap (kept) |

### `/api/enhance` Design

```typescript
// Request schema (Zod 4)
interface EnhanceRequest {
  text: string;                    // Raw OCR text (≤100KB)
  boxes: Array<{
    points: number[][];            // Bounding box coordinates
    text: string;                  // Recognized text for this box
    confidence: number;            // 0-1 confidence score
  }>;
  prompt?: string;                 // Optional custom prompt (≤500 chars)
}

// Response: SSE stream
// Stream LLM-enhanced text chunks to client
```

**LLM integration**: The endpoint is designed to be LLM-agnostic. The user will provide the specific LLM implementation later. The schema and streaming infrastructure are set up now; the actual LLM call is a placeholder.

### Removed Endpoints

| Endpoint | Reason |
|---|---|
| `POST /api/parse` | Jina Reader proxy — no longer needed |
| `POST /api/agent` | DeepSeek SEO analysis — no longer needed |

### Middleware (kept)

- `secureHeaders()`
- CORS
- Request logging (via `~/lib/logger`)
- Rate limiting on `/api/enhance` (20 req / 15 min per IP)

## Frontend Components

### New Components

```
src/components/ocr/
├── image-upload.tsx       # Drag & drop / paste / file picker / camera capture
├── ocr-canvas.tsx         # Image display + bounding box overlay
├── ocr-result.tsx         # Raw OCR text display (editable)
├── enhance-output.tsx     # LLM enhanced result (streaming)
└── ocr-progress.tsx       # Inference progress (model loading + pipeline stages)
```

**Image upload** (`image-upload.tsx`):
- Large drop zone with visual feedback
- Support: drag & drop, clipboard paste (Ctrl/Cmd+V), file picker, camera capture (mobile)
- Accepted formats: PNG, JPEG, WebP, BMP, TIFF
- Max file size: 20MB
- Show image preview after upload

**OCR canvas** (`ocr-canvas.tsx`):
- Display uploaded image
- Overlay colored bounding boxes for detected text regions
- Hover/click box to highlight corresponding text in result panel
- Toggle overlay on/off

**OCR result** (`ocr-result.tsx`):
- Display recognized text in editable textarea
- Show confidence scores per text block
- Copy all / copy selected
- Download as .txt

**Enhance output** (`enhance-output.tsx`):
- Streaming LLM response display (reuses existing SSE streaming pattern)
- Copy button
- Side-by-side comparison with raw OCR text

**OCR progress** (`ocr-progress.tsx`):
- Model download progress bar
- Pipeline stage indicators: Loading → Detecting → Classifying → Recognizing
- Estimated time remaining

### Removed Components

```
src/components/parser/         # All removed
├── url-agent-form.tsx
├── optimization-stats.tsx
├── agent-output.tsx
└── markdown-output.tsx
```

### Retained Components

```
src/components/ui/             # shadcn/ui primitives (kept)
src/components/layout/         # app-shell, header, footer, theme-toggle (kept)
src/components/seo/head.tsx    # SEO meta tags (kept)
src/components/link.tsx        # TanStack Router Link (kept)
```

## Removed Code

| Path | Reason |
|---|---|
| `src/server/routers/parse.ts` | Jina Reader proxy |
| `src/server/routers/agent.ts` | DeepSeek SEO analysis |
| `src/schemas/parse.ts` | Parse request schema |
| `src/schemas/agent.ts` | Agent request schema |
| `src/schemas/seo.ts` | SEO analysis types |
| `src/components/parser/*` | SEO UI components |
| `src/lib/parser/use-parse.ts` | Parse hook |
| `src/lib/parser/use-agent.ts` | Agent hook |
| `src/lib/parser/token-estimate.ts` | Token estimation |
| `src/__tests__/schemas/parse.test.ts` | Parse schema tests |
| `src/__tests__/schemas/agent.test.ts` | Agent schema tests |
| `src/__tests__/schemas/seo.test.ts` | SEO schema tests |
| `src/__tests__/server/parse.test.ts` | Parse route tests |

## New Dependencies

| Package | Purpose |
|---|---|
| `onnxruntime-web` | ONNX model inference in browser (WASM backend) |

## Project Structure (Post-Pivot)

```
src/
├── routes/
│   ├── __root.tsx              # Root layout (kept)
│   ├── index.tsx               # Homepage → OCR upload + results
│   ├── 404.tsx                 # 404 page (kept)
│   └── api/
│       └── $.ts                # Hono catch-all (kept)
├── server/
│   ├── hono.ts                 # Hono app (updated routes)
│   └── routers/
│       └── enhance.ts          # POST /api/enhance (new)
├── schemas/
│   └── enhance.ts              # Enhance request/response schema (new)
├── lib/
│   ├── ocr/
│   │   ├── engine.ts           # OCR engine orchestrator
│   │   ├── model-loader.ts     # Model download + IndexedDB cache
│   │   ├── pipeline.ts         # det → cls → rec pipeline
│   │   ├── preprocessor.ts     # Image → tensor preprocessing
│   │   ├── postprocessor.ts    # Model output → text/boxes
│   │   └── types.ts            # OCR result types
│   ├── logger.ts               # Logger (kept)
│   └── utils.ts                # cn() utility (kept)
├── components/
│   ├── ui/                     # shadcn/ui (kept)
│   ├── layout/                 # Layout components (kept)
│   ├── ocr/                    # OCR components (new)
│   │   ├── image-upload.tsx
│   │   ├── ocr-canvas.tsx
│   │   ├── ocr-result.tsx
│   │   ├── enhance-output.tsx
│   │   └── ocr-progress.tsx
│   ├── seo/
│   │   └── head.tsx            # (kept)
│   └── link.tsx                # (kept)
├── styles/
│   └── app.css                 # Tailwind v4 entry (kept)
└── __tests__/
    ├── lib/ocr/                # OCR engine tests (new)
    └── schemas/                # Enhance schema tests (new)
```

## Deployment

- **Platform**: Cloudflare Workers (unchanged)
- **Model files**: `public/models/pp-ocrv6-tiny/` — 3 ONNX files, deployed as static assets
- **CDN**: Cloudflare CDN auto-caches model files at edge globally
- **Browser caching**: IndexedDB for models, Cache API for assets
- **Bundle size**: App JS ~150KB gzipped + models ~1.5MB (loaded on demand)

## Environment Variables

| Var | Required | Purpose |
|---|---|---|
| `PUBLIC_ORIGIN` | yes | Canonical origin (unchanged) |
| `LOG_LEVEL` | no | Logger level (unchanged) |
| `LLM_API_KEY` | yes (for enhance) | API key for LLM post-processing (TBD by user) |

Note: `DEEPSEEK_API_KEY` and `JINA_API_KEY` are removed.

## Security

- **No images leave the browser**: OCR runs entirely client-side
- **Rate limiting**: `/api/enhance` capped at 20 req / 15 min per IP
- **Input validation**: Zod 4 schemas for enhance request
- **Logger redaction**: Retained for API keys and sensitive headers
- **No request body logging**: OCR text in enhance requests not logged

## Testing Strategy

| Area | Approach |
|---|---|
| OCR engine | Unit tests for preprocessor, postprocessor, pipeline orchestration (mock ONNX sessions) |
| Model loader | Unit tests for IndexedDB caching logic |
| Enhance schema | Zod validation tests (new `src/__tests__/schemas/enhance.test.ts`) |
| Enhance route | Hono handler tests with mocked LLM (new `src/__tests__/server/enhance.test.ts`) |
| Components | Manual testing (no DOM in Bun test runner) |

## Open Items

- [ ] **PP-OCRv6 ONNX models**: Need to obtain or convert from PaddleOCR to ONNX format
- [ ] **Pre/post-processing JS**: Determine if `paddleocr-onnx` npm package exists, or implement CTC decoding + DBNet NMS manually
- [ ] **LLM integration**: User will provide LLM details for `/api/enhance` endpoint
- [ ] **Camera capture**: Decide if camera API is needed for v1 or deferred
- [ ] **Multi-language model**: PP-OCRv6 Tiny covers 50 languages — confirm this is the right tier vs. language-specific models
