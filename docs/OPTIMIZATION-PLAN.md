# Parsify.dev — Tool Page Optimization Plan

> Last updated: 2026-02-19
> Status: **Draft — Pending Review**
> Scope: All 28 developer tools across 4 categories

---

## Table of Contents

- [Overview](#overview)
- [Methodology](#methodology)
- [Tier 1 — Core Tools (Highest ROI)](#tier-1--core-tools-highest-roi)
  - [1. JSON Tools](#1-json-tools)
  - [2. JSON Hero Viewer](#2-json-hero-viewer)
  - [3. JSONPath Queries](#3-jsonpath-queries)
  - [4. JWT Decoder](#4-jwt-decoder)
  - [5. Hash Generator](#5-hash-generator)
- [Tier 2 — High-Value Tools](#tier-2--high-value-tools)
  - [6. Regex Validator](#6-regex-validator)
  - [7. Password Generator](#7-password-generator)
  - [8. Base64 Encoder/Decoder](#8-base64-encoderdecoder)
  - [9. Timestamp Converter](#9-timestamp-converter)
  - [10. Text Analyzer](#10-text-analyzer)
- [Tier 3 — Tool-Level Improvements](#tier-3--tool-level-improvements)
  - [11. JSON Converter](#11-json-converter)
  - [12. JSON to TOML](#12-json-to-toml)
  - [13. AES Encryption](#13-aes-encryption)
  - [14. Key Pair Generator](#14-key-pair-generator)
  - [15. Diff Viewer](#15-diff-viewer)
  - [16. Markdown Editor](#16-markdown-editor)
  - [17. URL Parser](#17-url-parser)
  - [18. Color Tools](#18-color-tools)
  - [19. Cron Parser](#19-cron-parser)
  - [20. SQL Formatter](#20-sql-formatter)
  - [21-28. Remaining Tools](#21-28-remaining-tools)
- [Cross-Tool Architecture](#cross-tool-architecture)
- [Implementation Phases](#implementation-phases)
- [Appendix: Current Codebase Metrics](#appendix-current-codebase-metrics)

---

## Overview

This document outlines optimization plans for every tool page on parsify.dev. Recommendations are prioritized by **impact x usage frequency**, grouped into three tiers, and tagged with priority levels:

| Tag | Meaning | Expected Effort |
|-----|---------|-----------------|
| **P0** | Critical — blocks competitiveness or causes UX failure | 1-3 days |
| **P1** | High value — significant feature or quality gap vs competitors | 2-5 days |
| **P2** | Nice-to-have — polish, additional features, low urgency | 1-3 days |

**Competitor benchmarks**: jsonhero.io, jwt.io, regex101.com, jqplay.org, jsoncrack.com, transform.tools, jsonformatter.org

---

## Methodology

Each tool was evaluated across 6 dimensions:

1. **Feature completeness** — What's missing vs best-in-class competitors?
2. **Performance** — Main-thread blocking, missing memoization, large input handling
3. **UX quality** — Layout, error handling, copy/paste, keyboard shortcuts, loading states
4. **Accessibility** — aria-labels, keyboard navigation, form labels, color contrast
5. **Code quality** — Type safety, test coverage, DRY violations
6. **SEO/Discoverability** — Metadata quality, structured data, tool interconnection

---

## Tier 1 — Core Tools (Highest ROI)

### 1. JSON Tools

**File**: `src/components/tools/json/json-tool-complete.tsx` (227 LOC)
**Current features**: CodeMirror editor + JsonHeroViewer tree, Format/Minify/Copy/Unescape (serialized JSON detection), 250ms debounce parsing, valid/invalid badge.

#### Issues

| # | Issue | Severity | Description |
|---|-------|----------|-------------|
| 1 | No large file protection | High | `JSON.parse` runs on main thread; >1MB inputs freeze UI |
| 2 | No JSON Diff | High | Competitor standard (jsonformatter.org) — compare two JSON documents |
| 3 | No JSON Schema validation | High | No schema input + validation result display |
| 4 | Conversion features buried | Medium | JSON→YAML/XML/CSV hidden in separate sub-components, not accessible from main page |
| 5 | No keyboard shortcuts | Medium | Missing `Ctrl+Shift+F` (format), `Ctrl+Shift+M` (minify) |
| 6 | No drag-and-drop import | Medium | Cannot drag `.json` files onto the editor |
| 7 | No URL import | Low | jsonhero.io supports loading JSON from a URL |
| 8 | No persistent sessions | Low | Input lost on page refresh |

#### Optimization Plan

| # | Priority | Task | Details | Estimated Effort |
|---|----------|------|---------|-----------------|
| 1.1 | **P0** | Web Worker parsing | Move `JSON.parse`/`JSON.stringify` into a Web Worker. Auto-switch for inputs >100KB. Show spinner during parse. | 3 days |
| 1.2 | **P0** | Keyboard shortcuts | Register `Ctrl+Shift+F` (format), `Ctrl+Shift+M` (minify), `Ctrl+Shift+C` (copy) in CodeMirror keymap. Display hint badges in toolbar. | 1 day |
| 1.3 | **P1** | Drag & drop file import | Register `onDragOver`/`onDrop` on editor area. Accept `.json` files, read via `FileReader`, populate editor. Visual drop zone overlay. | 1 day |
| 1.4 | **P1** | Inline format conversion | Add "Convert" dropdown menu to toolbar → YAML / XML / CSV / TOML. Show converted output in a panel below or replacing the tree view. | 3 days |
| 1.5 | **P1** | JSON Diff tab | Add "Compare" tab to the tool. Reuse existing `diff-viewer` component. Two JSON inputs → side-by-side diff with highlighting. | 3 days |
| 1.6 | **P2** | JSON Schema validation | Add Schema input panel (collapsible). Use `ajv` library for validation. Highlight non-compliant nodes in tree view. | 5 days |
| 1.7 | **P2** | URL import | "Import from URL" button in toolbar → URL input → `fetch` with CORS handling → populate editor. | 1 day |
| 1.8 | **P2** | File size display | Show current JSON size (bytes/KB) and node count in toolbar status area. | 0.5 day |

#### Success Criteria
- Format 5MB JSON without UI freeze (Web Worker)
- All keyboard shortcuts functional and discoverable
- Drag `.json` file → editor populated within 500ms
- Convert to YAML/XML/CSV without leaving the page

---

### 2. JSON Hero Viewer

**File**: `src/components/tools/json/json-hero-viewer.tsx` (660 LOC)
**Current features**: Collapsible tree, search with debounce, type badges, node copy, breadcrumb navigation, keyboard nav (Arrow Left/Right), expand/collapse all, `maxVisibleItems` truncation.

#### Issues

| # | Issue | Severity | Description |
|---|-------|----------|-------------|
| 1 | Fake virtual scrolling | High | `maxVisibleItems=1000` is a slice truncation, not true virtualization — 1000 nodes still fully rendered in DOM |
| 2 | No column view | Medium | jsonhero.io's killer feature: Finder-style column navigation |
| 3 | Search doesn't highlight matches | Medium | Search filters nodes but doesn't highlight matching text within keys/values |
| 4 | No value preview panel | Medium | jsonhero.io shows rich previews for selected nodes (URL preview, color swatch, date formatting) |
| 5 | No path copy | Low | Can copy value but not JSONPath (e.g., `$.store.book[0].title`) |
| 6 | ArrowUp/Down not implemented | Low | Keyboard handler has `preventDefault` but no actual navigation logic |

#### Optimization Plan

| # | Priority | Task | Details | Estimated Effort |
|---|----------|------|---------|-----------------|
| 2.1 | **P0** | True virtual scrolling | Replace slice truncation with `@tanstack/react-virtual`. Support 100k+ nodes with smooth scrolling. Maintain expand/collapse state. | 3 days |
| 2.2 | **P1** | Search match highlighting | Wrap matched key/value substrings in `<mark>` tags with highlight styling. Keep existing filter logic. | 1 day |
| 2.3 | **P1** | ArrowUp/Down navigation | Implement `focusedIndex` state that traverses `visibleNodes` array. Scroll focused node into view. | 1 day |
| 2.4 | **P1** | Copy path button | Add "Copy Path" icon button (visible on hover) per node. Copy in `$.path.to.node` format. | 0.5 day |
| 2.5 | **P2** | Smart value preview | On node selection, detect value type: URL→clickable link, color hex→color swatch, ISO date→human-readable, image URL→thumbnail. Show in a side panel. | 3 days |
| 2.6 | **P2** | Column view mode | Add Finder-style three-column navigation (path | keys | values) as an alternative view mode toggle. | 5 days |

#### Success Criteria
- Render 100k-node JSON without jank (virtual scrolling)
- Search "price" → matching text highlighted in yellow within visible nodes
- Arrow keys navigate through entire visible tree
- Click "Copy Path" → `$.store.book[0].title` in clipboard

---

### 3. JSONPath Queries

**File**: `src/components/tools/json/jsonpath-queries.tsx` (612 LOC)
**Current features**: Query input, JSON data input, execute button, example queries, query history, result display with execution time.

#### Issues

| # | Issue | Severity | Description |
|---|-------|----------|-------------|
| 1 | **Fake JSONPath engine** | **Critical** | `evaluateJSONPath` is a series of `if` statements matching 8 hardcoded expressions. Does NOT support arbitrary JSONPath queries. |
| 2 | No jq support | High | Competitor jqplay.org supports both JSONPath and jq syntax |
| 3 | No syntax explanation | Medium | Doesn't explain what the user's expression means |
| 4 | No match highlighting | Medium | Results shown as JSON blob, not highlighted in source data |
| 5 | No multi-query comparison | Low | Cannot run multiple queries and compare results side-by-side |

#### Optimization Plan

| # | Priority | Task | Details | Estimated Effort |
|---|----------|------|---------|-----------------|
| 3.1 | **P0** | Replace with real JSONPath library | Install `jsonpath-plus` (~15KB gzip). Replace entire `evaluateJSONPath` function. Support full RFC 9535 JSONPath syntax. Remove all hardcoded if-else paths. | 2 days |
| 3.2 | **P1** | Syntax explanation panel | Below the query input, display a breakdown of expression parts with descriptions (similar to regex101's explanation area). | 3 days |
| 3.3 | **P1** | Source highlighting | Highlight matched nodes in the left JSON editor/viewer. Use node paths from query results to mark corresponding tree nodes. | 2 days |
| 3.4 | **P2** | jq support | Add `jq-web` WASM package. Tab toggle between JSONPath and jq modes. Share the same JSON input. | 5 days |
| 3.5 | **P2** | Query template library | Expand example list, categorize by use case: array filtering, recursive search, conditional queries, aggregation. | 1 day |

#### Success Criteria
- Any valid JSONPath expression returns correct results (not just 8 hardcoded ones)
- `$.store.book[?(@.price > 10 && @.category == 'fiction')]` works correctly
- Expression explanation shows for user-typed queries

---

### 4. JWT Decoder

**File**: `src/components/tools/security/jwt-decoder.tsx` (389 LOC)
**Current features**: Header/Payload/Signature decode, algorithm display, expiration time calculation, token structure visualization.

#### Issues

| # | Issue | Severity | Description |
|---|-------|----------|-------------|
| 1 | No signature verification | High | jwt.io's core feature — input secret/public key to verify signature |
| 2 | No live editing | Medium | jwt.io supports editing payload and re-encoding in real time |
| 3 | No algorithm selector | Medium | Missing HS256/RS256/ES256 algorithm switching |
| 4 | Code duplication | Low | `src/app/security/jwt-decoder/client.tsx` duplicates 100+ lines from the component |

#### Optimization Plan

| # | Priority | Task | Details | Estimated Effort |
|---|----------|------|---------|-----------------|
| 4.1 | **P0** | Signature verification | Add Secret/Public Key input. Use `crypto.subtle` to verify HMAC-SHA256 and RSA signatures. Show green/red verification indicator. | 3 days |
| 4.2 | **P1** | jwt.io-style layout | Redesign to three-panel: left = encoded token, right-top = header (color-coded), right-middle = payload (color-coded), right-bottom = signature verification status. | 2 days |
| 4.3 | **P1** | Live payload editing | Enable editing Header/Payload sections → auto re-encode to JWT (requires secret for signing). | 3 days |
| 4.4 | **P2** | Common claim labels | For `exp`, `iat`, `nbf`: show human-readable timestamps and countdown timer. For `iss`, `aud`: show as labeled badges. | 1 day |
| 4.5 | **P2** | Deduplicate client.tsx | Remove `src/app/security/jwt-decoder/client.tsx` duplication, use shared component. | 0.5 day |

#### Success Criteria
- Paste JWT + enter secret → "Signature Verified" green indicator
- Edit payload claim → JWT re-encoded automatically
- `exp` claim shows "Expires in 2h 34m" countdown

---

### 5. Hash Generator

**File**: `src/components/tools/data/hash-generator.tsx` (396 LOC)
**Current features**: MD5/SHA1/SHA256/SHA512 generation from text input, one-click copy per algorithm.

#### Issues

| # | Issue | Severity | Description |
|---|-------|----------|-------------|
| 1 | No file hashing | High | Competitors support drag-and-drop file checksum calculation |
| 2 | No HMAC mode | Medium | Missing keyed-hash authentication mode |
| 3 | No hash verification | Medium | Cannot input a known hash to verify against |
| 4 | Limited algorithms | Low | Missing SHA3-256, BLAKE2, CRC32 |

#### Optimization Plan

| # | Priority | Task | Details | Estimated Effort |
|---|----------|------|---------|-----------------|
| 5.1 | **P0** | File drag-and-drop hashing | Support dragging files onto the tool. Use `crypto.subtle` with streaming `FileReader` for large files (chunked processing with progress bar). | 3 days |
| 5.2 | **P1** | Hash verify mode | New "Verify" tab: input file/text + known hash value → green check / red X result. | 2 days |
| 5.3 | **P1** | HMAC support | Add "HMAC" toggle and Key input field. Generate keyed hashes using `crypto.subtle.sign`. | 2 days |
| 5.4 | **P2** | Additional algorithms | Add SHA3-256, BLAKE2b, CRC32 via `hash-wasm` library. | 2 days |

#### Success Criteria
- Drag 500MB file → hash computed with progress bar, no UI freeze
- "Verify" tab: paste SHA256 + file → instant match/mismatch indicator
- HMAC-SHA256 with custom key produces correct output

---

## Tier 2 — High-Value Tools

### 6. Regex Validator

**File**: `src/components/tools/code/regex-validator.tsx` (468 LOC)
**Current features**: Pattern matching, flag toggles (g/i/m/s/u/y), match highlighting with `<mark>`, cheat sheet panel. Already has `useMemo`/`useCallback` and `aria-pressed`.

| # | Priority | Task | Details |
|---|----------|------|---------|
| 6.1 | **P1** | Explanation panel | Parse regex tokens and display meaning for each part (like regex101's tree). Use a lightweight regex parser. |
| 6.2 | **P1** | Substitution mode | Add "Replace" input field + live preview of substituted text. |
| 6.3 | **P2** | Code generation | One-click generate JS/Python/Go/Java/Rust code snippets using the current pattern. |
| 6.4 | **P2** | Common pattern library | Curated templates: email, URL, IP address, phone number, date formats. |

---

### 7. Password Generator

**File**: `src/components/tools/security/password-generator.tsx` (536 LOC)
**Current features**: Customizable length/character sets, strength analysis, entropy calculation, show/hide toggle.

| # | Priority | Task | Details |
|---|----------|------|---------|
| 7.1 | **P1** | Passphrase mode | Word-based passwords (e.g., `correct-horse-battery-staple`). Use EFF word list. Configurable word count and separator. |
| 7.2 | **P1** | Breach check | Check against Have I Been Pwned k-Anonymity API (only sends first 5 chars of SHA1 hash — privacy safe). Show warning if password found in known breaches. |
| 7.3 | **P2** | Batch generation | Generate N passwords at once, display in a table, CSV export. |

---

### 8. Base64 Encoder/Decoder

**File**: `src/components/tools/utilities/base64-converter.tsx` (607 LOC)
**Current features**: Text/file modes, encode/decode, example presets, swap input/output. Already has `useCallback`/`useMemo` throughout.

| # | Priority | Task | Details |
|---|----------|------|---------|
| 8.1 | **P1** | URL-safe Base64 | Add Base64url encoding option (RFC 4648 §5). Toggle between standard and URL-safe. |
| 8.2 | **P1** | Auto-detection | On paste, detect if content is Base64 or plaintext. Show hint: "Looks like Base64 — decode?" |
| 8.3 | **P2** | Streaming for large files | Use chunked `FileReader` + progress bar for files >5MB. |

---

### 9. Timestamp Converter

**File**: `src/app/network/timestamps/client.tsx`
**Current features**: Unix/ISO/UTC/local time conversion, timezone selection, calendar info.

| # | Priority | Task | Details |
|---|----------|------|---------|
| 9.1 | **P1** | Live clock | Top banner showing current Unix timestamp updating every second. Click to copy. |
| 9.2 | **P1** | Duration calculator | "X days from now" and "difference between two timestamps" calculator. |
| 9.3 | **P2** | Multi-timezone display | Show 5+ timezone clocks simultaneously (configurable). Useful for distributed teams. |

---

### 10. Text Analyzer

**File**: `src/components/tools/text/text-analyzer.tsx` (804 LOC)
**Current features**: Character/word/line/sentence counts, readability scoring (Flesch-Kincaid, etc.), encoding analysis, sample texts. Already has `useMemo`/`useCallback`.

| # | Priority | Task | Details |
|---|----------|------|---------|
| 10.1 | **P1** | Keyword density | SEO keyword frequency analysis + simple word cloud visualization. |
| 10.2 | **P1** | Reading time estimate | Display estimated reading time based on word count (~200-250 WPM). |
| 10.3 | **P2** | Content-type awareness | Detect if input is Markdown/code/prose and adjust counting logic accordingly. |

---

## Tier 3 — Tool-Level Improvements

### 11. JSON Converter

**File**: `src/components/tools/json/json-converter.tsx` (297 LOC)

| # | Priority | Task |
|---|----------|------|
| 11.1 | **P1** | Add output formats: TOML (reuse `smol-toml`), TypeScript interfaces (auto-generate), Go structs |
| 11.2 | **P1** | Bidirectional conversion: YAML→JSON, XML→JSON reverse support |
| 11.3 | **P2** | Auto-convert on input change (remove need for "Convert" button click) |

### 12. JSON to TOML

**File**: `src/components/tools/json/json-to-toml.tsx` (166 LOC)

| # | Priority | Task |
|---|----------|------|
| 12.1 | **P1** | Real-time conversion (convert as you type, remove button) |
| 12.2 | **P1** | Bidirectional: TOML→JSON support |
| 12.3 | **P2** | Replace Textarea with CodeMirror for TOML syntax highlighting |

### 13. AES Encryption

**File**: `src/components/tools/security/aes-encryption.tsx` (621 LOC)

| # | Priority | Task |
|---|----------|------|
| 13.1 | **P1** | Add ChaCha20-Poly1305 algorithm option |
| 13.2 | **P2** | File encryption mode: drag file → encrypt → download encrypted file |

### 14. Key Pair Generator

**File**: `src/components/tools/security/key-pair-generator.tsx` (346 LOC)

| # | Priority | Task |
|---|----------|------|
| 14.1 | **P1** | Add Ed25519 and ECDSA key types |
| 14.2 | **P1** | Output format selector: PEM / DER / JWK |
| 14.3 | **P2** | SSH public key format export (`ssh-rsa ...`, `ssh-ed25519 ...`) |

### 15. Diff Viewer

**File**: `src/components/tools/code/diff-viewer.tsx` (302 LOC)

| # | Priority | Task |
|---|----------|------|
| 15.1 | **P1** | Syntax-highlighted diff (detect language, apply highlighting to both sides) |
| 15.2 | **P1** | Inline/char-level diff (highlight character-level differences within changed lines) |
| 15.3 | **P2** | Three-way merge view (base + ours + theirs) |

### 16. Markdown Editor

**File**: `src/components/tools/text/markdown-editor.tsx` (349 LOC)

| # | Priority | Task |
|---|----------|------|
| 16.1 | **P1** | Formatting toolbar (bold/italic/link/image/code block/heading buttons) |
| 16.2 | **P1** | Mermaid diagram rendering support in preview |
| 16.3 | **P2** | Export to PDF (via browser print or `html2canvas`) |

### 17. URL Parser

**Component**: page-level component

| # | Priority | Task |
|---|----------|------|
| 17.1 | **P1** | URL builder mode (assemble URL from components) |
| 17.2 | **P1** | Query string editor (key-value table → encoded URL) |
| 17.3 | **P2** | Batch URL parsing (paste multiple URLs, parse all) |

### 18. Color Tools

**Component**: page-level component

| # | Priority | Task |
|---|----------|------|
| 18.1 | **P1** | Palette generator (primary color → complementary/analogous/triadic) |
| 18.2 | **P1** | WCAG contrast ratio checker (foreground + background → AA/AAA compliance) |
| 18.3 | **P2** | CSS gradient generator |

### 19. Cron Parser

**File**: `src/components/tools/utilities/cron-parser.tsx` (169 LOC)

| # | Priority | Task |
|---|----------|------|
| 19.1 | **P1** | Visual timeline (plot next 10 run times on a visual timeline) |
| 19.2 | **P2** | Cron builder (drag-and-drop UI → generate expression) |

### 20. SQL Formatter

**File**: `src/components/tools/code/sql-tools.tsx` (419 LOC)

| # | Priority | Task |
|---|----------|------|
| 20.1 | **P1** | Dialect selector (MySQL / PostgreSQL / SQLite / Oracle formatting rules) |
| 20.2 | **P2** | ERD visualization (parse CREATE TABLE statements → relationship diagram) |

### 21-28. Remaining Tools

**Tools**: ID Generator, ID Analyzer, Lorem Ipsum, Compression, HTML Tools, HTML Viewer, Secret Generator, DNS Lookup, Base64 Image, Text Case Converter, Text Inspector

| # | Priority | Task | Applies To |
|---|----------|------|-----------|
| R.1 | **P2** | Keyboard shortcut hints | All tools — show `Cmd+Shift+F` style badges in toolbars |
| R.2 | **P2** | Share via URL | All tools — encode current input/config into URL hash for sharing |
| R.3 | **P2** | DNS: WHOIS query | DNS Lookup — add WHOIS lookup alongside DNS records |
| R.4 | **P2** | Compression: Zstd support | Compression Tool — add Zstandard algorithm option |
| R.5 | **P2** | ID Generator: Snowflake IDs | ID Generator — add Twitter Snowflake and CUID2 formats |
| R.6 | **P2** | HTML Viewer: CSS injection | HTML Viewer — allow adding custom CSS alongside HTML for live preview |

---

## Cross-Tool Architecture

Infrastructure improvements that benefit all tools simultaneously.

| # | Priority | Task | Description | Estimated Effort |
|---|----------|------|-------------|-----------------|
| A.1 | **P0** | Web Worker infrastructure | Create `src/lib/workers/` with a generic Worker pool. Move CPU-intensive operations (JSON parse/stringify, hash computation, regex evaluation) into workers. | 5 days |
| A.2 | **P1** | Unified keyboard shortcut system | Create `useKeyboardShortcuts` hook. All tools register shortcuts through it. Conflict detection. Display shortcut hints. `Cmd+K` to open shortcut palette. | 3 days |
| A.3 | **P1** | JSON utils test coverage | `json-utils.ts` (463 LOC) only has `json-validator.test.ts` (148 LOC). Missing tests for: `convertJson`, `sortJsonKeys`, `parseSerializedJson`, `jsonToXml`, `jsonToYaml`, `jsonToCsv`, `isSerializedJsonString`. Target: 90%+ line coverage. | 2 days |
| A.4 | **P2** | Tool interconnection | Add "Send to..." buttons: JSON Tools output → "Send to JSONPath" / "Send to Converter" / "Send to Diff". Hash Generator → "Send to Verify". | 3 days |
| A.5 | **P2** | localStorage persistence | All tools auto-save last input to `localStorage`. Restore on page load. "Clear saved data" button in each tool. | 2 days |
| A.6 | **P2** | Dark mode color fixes | Fix hardcoded light-mode colors in `json-validator.tsx` (`bg-blue-50`, `bg-green-50`, `bg-red-50`). Use Tailwind `dark:` variants consistently. | 1 day |
| A.7 | **P2** | Unified toast notifications | Audit all tools for inconsistent success/error feedback. Standardize on `sonner` toast with consistent messages. | 1 day |

---

## Implementation Phases

### Phase 1 — Foundation & Critical Fixes (Weeks 1-2)

**Focus**: Fix critical gaps, establish infrastructure.

| Task | Source | Priority |
|------|--------|----------|
| Replace fake JSONPath engine with `jsonpath-plus` | 3.1 | P0 |
| Web Worker infrastructure + JSON parsing | A.1, 1.1 | P0 |
| Keyboard shortcuts (JSON Tools) | 1.2 | P0 |
| JWT signature verification | 4.1 | P0 |
| File hashing with drag-and-drop | 5.1 | P0 |
| True virtual scrolling for JSON viewer | 2.1 | P0 |

**Exit criteria**: All P0 items pass `bun run typecheck && bun run lint && bun test && bun run build`.

### Phase 2 — Feature Parity (Weeks 2-4)

**Focus**: Close the gap with competitor tools.

| Task | Source | Priority |
|------|--------|----------|
| JSON Diff tab | 1.5 | P1 |
| Drag-and-drop file import (JSON) | 1.3 | P1 |
| Inline format conversion | 1.4 | P1 |
| Search match highlighting (viewer) | 2.2 | P1 |
| Copy path button (viewer) | 2.4 | P1 |
| JSONPath syntax explanation | 3.2 | P1 |
| jwt.io-style layout | 4.2 | P1 |
| Hash verify mode | 5.2 | P1 |
| HMAC support | 5.3 | P1 |
| Regex explanation panel | 6.1 | P1 |
| Regex substitution mode | 6.2 | P1 |
| Passphrase generator | 7.1 | P1 |
| URL-safe Base64 | 8.1 | P1 |
| Live timestamp clock | 9.1 | P1 |
| JSON utils test coverage | A.3 | P1 |
| Unified keyboard shortcuts | A.2 | P1 |

**Exit criteria**: Feature parity with jwt.io (signature), regex101 (explanation), jsonhero.io (viewer quality).

### Phase 3 — Polish & Differentiation (Weeks 4-6)

**Focus**: Unique features, cross-tool integration, polish.

| Task | Source | Priority |
|------|--------|----------|
| Smart value preview (viewer) | 2.5 | P2 |
| Column view mode (viewer) | 2.6 | P2 |
| JSON Schema validation | 1.6 | P2 |
| jq support | 3.4 | P2 |
| JWT claim labels + countdown | 4.4 | P2 |
| Additional hash algorithms | 5.4 | P2 |
| Breach check (password) | 7.2 | P2 |
| Tool interconnection | A.4 | P2 |
| localStorage persistence | A.5 | P2 |
| Share via URL | R.2 | P2 |
| All Tier 3 tool improvements | 11-20 | P2 |

**Exit criteria**: All tools pass accessibility audit, dark mode works correctly, test coverage >80%.

---

## Appendix: Current Codebase Metrics

### Component Size (LOC, descending)

| Component | File | LOC |
|-----------|------|-----|
| Text Analyzer | `text-analyzer.tsx` | 804 |
| Data Validator | `data-validator.tsx` | 727 |
| JSON Hero Viewer | `json-hero-viewer.tsx` | 660 |
| AES Encryption | `aes-encryption.tsx` | 621 |
| JSONPath Queries | `jsonpath-queries.tsx` | 612 |
| Base64 Converter | `base64-converter.tsx` | 607 |
| Text Case Converter | `text-case-converter.tsx` | 587 |
| Password Generator | `password-generator.tsx` | 536 |
| Text Inspector | `text-inspector.tsx` | 500 |
| Regex Validator | `regex-validator.tsx` | 468 |
| JSON Utils | `json-utils.ts` | 463 |
| URL Encoder | `url-encoder.tsx` | 444 |
| SQL Tools | `sql-tools.tsx` | 419 |
| Hash Generator | `hash-generator.tsx` | 396 |
| JWT Decoder | `jwt-decoder.tsx` | 389 |
| Markdown Editor | `markdown-editor.tsx` | 349 |
| Key Pair Generator | `key-pair-generator.tsx` | 346 |
| Diff Viewer | `diff-viewer.tsx` | 302 |
| JSON Converter | `json-converter.tsx` | 297 |
| JSON Viewer | `json-viewer.tsx` | 288 |
| JSON Formatter | `json-formatter.tsx` | 241 |
| JSON Tool Complete | `json-tool-complete.tsx` | 227 |
| JSON Simple Editor | `json-simple-editor.tsx` | 221 |
| Compression Tool | `compression-tool.tsx` | 217 |
| HTML Tools | `html-tools.tsx` | 196 |
| JSON Validator | `json-validator.tsx` | 177 |
| Cron Parser | `cron-parser.tsx` | 169 |
| JSON to TOML | `json-to-toml.tsx` | 166 |
| ID Analyzer | `id-analyzer.tsx` | 159 |
| Secret Generator | `secret-generator.tsx` | 153 |

### Test Coverage

| Test File | Tests | Assertions |
|-----------|-------|-----------|
| `json-validator.test.ts` | 24 | ~48 |
| `aes-operations.test.ts` | 6 | ~12 |
| `rsa-operations.test.ts` | 6 | ~12 |
| `sanitize.test.ts` | 6 | ~12 |
| 7 other test files | 87 | ~178 |
| **Total** | **129** | **262** |

### Key Dependencies

| Package | Used By | Purpose |
|---------|---------|---------|
| `smol-toml` | JSON to TOML | TOML serialization |
| `spark-md5` | Hash Generator | MD5 hashing |
| `sonner` | All tools | Toast notifications |
| `@phosphor-icons/react` | All tools | Icon system |
| `@codemirror/*` | JSON/SQL editors | Code editor |

### Potential New Dependencies

| Package | Size (gzip) | For Task |
|---------|-------------|----------|
| `jsonpath-plus` | ~15 KB | 3.1 — Real JSONPath engine |
| `@tanstack/react-virtual` | ~5 KB | 2.1 — Virtual scrolling |
| `ajv` | ~30 KB | 1.6 — JSON Schema validation |
| `hash-wasm` | ~20 KB | 5.4 — Additional hash algorithms |
| `jq-web` | ~500 KB (WASM) | 3.4 — jq support (Phase 3 only) |
