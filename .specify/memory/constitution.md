<!--
Sync Impact Report:
Version change: 1.0.1 → 1.0.2 (maintenance update - date refresh only)
Modified principles: N/A (no changes to core principles)
Added sections: N/A
Removed sections: N/A
Templates requiring updates: ✅ plan-template.md, ✅ spec-template.md, ✅ tasks-template.md (all verified current - placeholder tokens correctly preserved)
Follow-up TODOs: N/A
-->

# Parsify.dev Constitution

## Core Principles

### I. Tool-First Architecture
Every developer tool MUST be implementable as a standalone, independently testable unit. Tools MUST be self-contained with clear input/output contracts, documented behavior, and focused purpose. No organizational-only abstractions - each tool MUST provide direct user value.

### II. Web-Native Interface
All tools MUST expose functionality through web interfaces with consistent patterns: structured input → processed output → error handling. Support both machine-readable (JSON) and human-readable formats. Every tool MUST be accessible via URL parameters for direct linking and sharing.

### III. Test-Driven Development (NON-NEGOTIABLE)
TDD is mandatory: Tests MUST be written and fail BEFORE implementation. User scenarios MUST be defined and approved before any code. Red-Green-Refactor cycle is strictly enforced. Every tool MUST have automated tests for core functionality.

### IV. Integration & Contract Testing
Focus areas requiring integration tests: New tool contracts, API changes, cross-tool communication, shared data schemas. Every tool MUST validate its contracts and integration points with automated tests.

### V. Simplicity & Incremental Delivery
Start with the simplest working solution, avoid premature optimization. Each tool MUST be independently valuable and deployable. YAGNI principles apply - build only what is needed for immediate user value. Every feature MUST be independently testable and demonstrable.

## Technology Standards

### Stack Requirements
- **Frontend**: Next.js 14+ with TypeScript 5+, Tailwind CSS for styling
- **Backend**: Cloudflare Workers with Hono framework for APIs
- **Database**: Cloudflare D1 for persistent storage when needed
- **Testing**: Vitest for unit tests, Playwright for e2e tests
- **Build**: Vite for development, pnpm for package management
- **Language**: TypeScript 5+ with strict type checking enabled

### Performance & Accessibility
- All tools MUST load and be usable within 3 seconds on standard connections
- Responsive design required for mobile and desktop
- Accessibility standards (WCAG 2.1 AA) MUST be met
- Client-side processing preferred when possible for offline capability

### Security & Privacy
- No user data should be sent to external servers without explicit consent
- All user input MUST be sanitized and validated
- Privacy-focused design: local processing when feasible
- No tracking or analytics without user permission

## Development Workflow

### Code Quality Gates
- All code MUST pass ESLint and Prettier formatting checks
- TypeScript MUST compile without errors or warnings
- All tests MUST pass before merging
- Code review is required for all changes
- Each commit MUST represent working, tested functionality

### Release Process
- Features are developed in feature branches with clear naming
- Each feature MUST be independently testable and deployable
- Continuous integration validates all quality gates
- Features are released incrementally, not in big bangs
- Rollback capability MUST be maintained for all releases

## Governance

This constitution supersedes all other development practices and guidelines. Amendments require:
- Documented rationale and impact analysis
- Team approval and review
- Migration plan for existing code
- Version increment following semantic versioning

All pull requests and reviews MUST verify compliance with this constitution. Complexity MUST be justified with clear user value. Use this constitution as the primary guidance for all development decisions.

**Version**: 1.0.2 | **Ratified**: 2025-01-09 | **Last Amended**: 2025-10-19