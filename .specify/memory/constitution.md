# Parsify.dev Constitution
<!-- Version: 1.0.0 | Ratified: 2025-01-18 | Last Amended: 2025-01-18 -->

## Core Principles

### I. Client-Side Processing
All tools MUST execute client-side in the browser using JavaScript/TypeScript. No server-side processing or backend APIs allowed. Each tool must be self-contained, independently testable, and work offline after initial load. Clear purpose required - no organizational-only components.

### II. Monaco Editor Integration
Every tool that processes code or data MUST use Monaco Editor for input/output. Monaco must be lazy-loaded with language-specific configurations. Support JSON + human-readable formats with syntax highlighting and IntelliSense where applicable.

### III. Tool Modularity (NON-NEGOTIABLE)
Each tool must be implemented as a standalone React component with: Independent TypeScript interfaces, Self-contained state management, Isolated styling with Tailwind CSS, Individual error handling. Tools must be independently testable and deployable.

### IV. Progressive Enhancement
Core functionality MUST work without JavaScript enabled where possible. Enhanced features require JavaScript but basic tool operations should gracefully degrade. Focus on accessibility and keyboard navigation support.

### V. Performance & Bundle Size
Total bundle size must stay under 2MB compressed. Individual tool lazy-loading required. Monaco Editor language bundles loaded on-demand. Core Web Vitals targets: LCP < 2.5s, FID < 100ms, CLS < 0.1.

## Additional Constraints

### Security Requirements
- No eval() or unsafe dynamic code execution
- Input sanitization for all user data
- CSP-compliant implementation
- No external CDN dependencies for core functionality

### Technology Standards
- TypeScript 5.0+ in strict mode
- React 19+ with functional components and hooks
- Tailwind CSS for styling (no custom CSS)
- Next.js App Router for routing
- Zustand for state management (avoid Context API)

## Development Workflow

### Quality Gates
- All tools must have unit tests with Vitest
- E2E tests with Playwright for user journeys
- TypeScript strict mode compliance required
- Biome linting and formatting enforced via Husky
- Bundle analysis with webpack-bundle-analyzer required

### Review Process
- Code review required for all tool implementations
- Performance review for bundle size impact
- Accessibility review with screen readers
- Security review for input handling

## Governance

This constitution supersedes all other practices and guidelines. Amendments require: Documentation updates across all templates, Team approval via GitHub discussion, Migration plan for existing tools, Version update according to semantic versioning.

All PRs and reviews must verify compliance against these principles. Any complexity or deviations must be explicitly justified in PR descriptions. Use docs/DEVELOPMENT.md for runtime development guidance.

---

**Sync Impact Report:**
- Version change: 0.0.0 → 1.0.0 (initial constitution)
- Modified principles: None (new constitution)
- Added sections: All sections (new constitution)
- Removed sections: None
- Templates updated: 
  - ✅ plan-template.md (constitution check alignment)
  - ✅ tasks-template.md (quality gates enforcement)
  - ⚠️ spec-template.md (requires security constraint updates)
- Follow-up TODOs: Update spec-template.md with security and performance constraints