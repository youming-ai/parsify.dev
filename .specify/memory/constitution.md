<!--
Sync Impact Report:
Version change: 1.0.0 → 1.0.0 (initial constitution)
Modified principles: N/A (initial creation)
Added sections: All sections
Removed sections: N/A
Templates requiring updates: 
  ✅ plan-template.md (checked for consistency)
  ✅ spec-template.md (checked for consistency) 
  ✅ tasks-template.md (checked for consistency)
Follow-up TODOs: N/A
-->

# Parsify.dev Constitution

## Core Principles

### I. Client-First Processing
All tools MUST prioritize client-side processing for privacy and performance. Tools should run entirely in the browser when technically feasible, with no server-side dependencies for core functionality. Server-side processing should only be used for features that cannot be implemented client-side (e.g., large file processing, external API integrations).

### II. Privacy by Design
User data MUST NOT leave the browser unless explicitly required for the tool's functionality. No telemetry or analytics that could expose user data content. All processing happens locally, with temporary data stored only in browser memory and cleared when the session ends.

### III. Tool-Centric Architecture
Every feature MUST be implemented as a standalone tool with clear boundaries. Tools share common UI components and infrastructure but maintain independent logic and state. Each tool MUST be independently discoverable, testable, and deployable.

### IV. Progressive Enhancement
Tools MUST work with basic functionality first, then enhance with advanced features. Core functionality should not depend on optional features. Ensure graceful degradation when advanced features (like Monaco Editor) are loading or unavailable.

### V. Type Safety & Validation
All inputs and outputs MUST be strongly typed with comprehensive validation. Tools should provide real-time feedback for invalid inputs and clear error messages. TypeScript strict mode is mandatory for all new code.

## Development Standards

### Technology Stack Constraints
- **Frontend**: Next.js 16+ with App Router, TypeScript 5.7+, React 19+
- **Styling**: Tailwind CSS with shadcn/ui components only
- **State Management**: Zustand for client-side state, React hooks for component state  
- **Code Editor**: Monaco Editor (lazy-loaded) for code-related tools
- **Testing**: Vitest for unit tests, Playwright for E2E tests
- **Package Manager**: pnpm v10.18.3 (enforced)

### Performance Requirements
- **Bundle Size**: Core bundle MUST stay under 500KB gzipped
- **Loading**: Monaco Editor MUST be lazy-loaded to prevent initial bundle bloat
- **Runtime**: Tools should complete operations within 5 seconds for typical inputs
- **Memory**: Client-side processing should not exceed 100MB memory usage

### Security Standards
- **Code Execution**: All code execution MUST use secure sandboxing (WASM/isolated environments)
- **File Processing**: File uploads MUST be processed client-side when possible
- **Data Storage**: No persistent storage of user input data beyond browser session
- **Dependencies**: All dependencies MUST be scanned for security vulnerabilities

## Quality Assurance

### Testing Requirements
- **Unit Tests**: All utility functions and business logic MUST have unit tests
- **Integration Tests**: Tool workflows MUST be tested end-to-end
- **Type Coverage**: 100% TypeScript coverage with strict mode enabled
- **Browser Testing**: Tools must work in latest Chrome, Firefox, Safari, and Edge

### Code Quality Standards
- **Linting**: Biome MUST pass with no errors or warnings
- **Formatting**: Automatic formatting with Biome (tab indentation, 120 char width)
- **Imports**: Automatic import sorting enabled
- **Documentation**: Complex functions MUST have JSDoc comments

### User Experience Standards
- **Responsive Design**: Tools MUST work on mobile and desktop devices
- **Dark Mode**: All tools MUST support dark/light theme switching
- **Error Handling**: Graceful error recovery with clear user feedback
- **Loading States**: Appropriate loading indicators for all async operations

## Governance

This constitution supersedes all other development practices and guidelines. Amendments require:

1. **Documentation**: Proposed changes MUST be documented with clear rationale
2. **Review**: All constitution changes MUST undergo team review
3. **Versioning**: Constitution version MUST follow semantic versioning (MAJOR.MINOR.PATCH)
4. **Migration**: Changes MUST include migration plan for existing code/tools

### Compliance Requirements
- All pull requests MUST verify compliance with constitution principles
- New tools MUST pass constitution checklist before implementation begins
- Code reviews MUST check for constitutional compliance
- Complexity deviations MUST be explicitly justified in PR descriptions

### Guideline References
- Use `CLAUDE.md` for runtime development guidance and project-specific patterns
- Refer to tool templates in `src/components/tools/` for implementation patterns
- Consult `src/data/tools-data.ts` for tool metadata requirements

**Version**: 1.0.0 | **Ratified**: 2025-11-02 | **Last Amended**: 2025-11-02