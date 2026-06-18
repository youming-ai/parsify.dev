# Task 1: Clean up dependencies and ignore generated assets

**Goal:** Remove unused devtools dependency and ignore generated worker and WASM assets.

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

## Requirements:
1. Remove `@tanstack/react-router-devtools` dependency from `package.json` and update lockfile.
2. Update `.gitignore` to include:
```
# Generated assets
public/pdf.worker.min.mjs
public/ort/
```
3. Untrack the generated assets from Git: `public/pdf.worker.min.mjs` and `public/ort/`.
4. Commit changes.
