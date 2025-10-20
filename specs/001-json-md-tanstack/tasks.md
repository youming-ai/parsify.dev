# Tasks: JSON.md Reader with TanStack Ecosystem

**Input**: Design documents from `/specs/001-json-md-tanstack/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: TanStack Start, TypeScript, React tech stack
2. Load optional design documents:
   → data-model.md: Extract JsonFile, JsonDocument, JsonNode entities
   → contracts/file-processing.json: File validation and parsing contracts
   → research.md: Technical decisions for client-side processing
   → quickstart.md: Test scenarios and user workflows
3. Generate tasks by category:
   → Setup: TanStack project, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: file processing, JSON viewer components
   → Integration: state management, error handling
   → Polish: unit tests, performance, accessibility
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests
   → All entities have models
   → All components implemented
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single web application**: `src/`, `tests/` at repository root
- Paths follow TanStack Start conventions with app router structure

## Phase 3.1: Setup
- [x] T001 Create project structure per implementation plan
- [x] T002 Initialize TanStack Start project with TypeScript dependencies
- [x] T003 [P] Configure linting and formatting tools (ESLint, Prettier)
- [x] T004 [P] Set up testing framework (Vitest, React Testing Library)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T005 [P] Contract test file validation in tests/contract/test-file-validation.ts
- [x] T006 [P] Contract test JSON parsing in tests/contract/test-json-parsing.ts
- [x] T007 [P] Integration test file upload workflow in tests/integration/test-file-upload.tsx
- [x] T008 [P] Integration test JSON viewer component in tests/integration/test-json-viewer.tsx
- [x] T009 [P] Performance test large file handling in tests/performance/test-file-performance.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T010 [P] JsonFile entity model in src/lib/models/JsonFile.ts
- [x] T011 [P] JsonDocument entity model in src/lib/models/JsonDocument.ts
- [x] T012 [P] JsonNode entity model in src/lib/models/JsonNode.ts
- [x] T013 [P] File parsing utilities in src/lib/fileParser.ts
- [x] T014 [P] JSON extraction utilities in src/lib/jsonExtractor.ts
- [x] T015 [P] Type definitions in src/lib/types.ts
- [x] T016 File validation service in src/lib/services/fileValidationService.ts
- [x] T017 JSON parsing service in src/lib/services/jsonParsingService.ts
- [x] T018 Error handling utilities in src/lib/errorHandler.ts

## Phase 3.4: React Components
- [x] T019 [P] FileSelector component in src/components/FileSelector/FileSelector.tsx
- [x] T020 [P] ErrorBoundary component in src/components/ErrorBoundary/ErrorBoundary.tsx
- [x] T021 JsonViewer component in src/components/JsonViewer/JsonViewer.tsx
- [x] T022 JsonNode component (tree node) in src/components/JsonViewer/JsonNode.tsx
- [x] T023 SearchComponent in src/components/Search/SearchComponent.tsx
- [x] T024 LoadingSpinner component in src/components/Loading/LoadingSpinner.tsx

## Phase 3.5: Hooks and State Management
- [x] T025 [P] useFileReader hook in src/hooks/useFileReader.ts
- [x] T026 [P] useJsonParser hook in src/hooks/useJsonParser.ts
- [ ] T027 [P] useJsonViewer hook in src/hooks/useJsonViewer.ts
- [ ] T028 [P] useSearch hook in src/hooks/useSearch.ts
- [x] T029 TanStack Query integration in src/lib/queryClient.ts

## Phase 3.6: Pages and Routing
- [ ] T030 Home page component in src/pages/Home.tsx
- [ ] T031 JsonViewer page in src/pages/JsonViewer.tsx
- [ ] T032 App router configuration in src/app/router.tsx
- [ ] T033 Root layout component in src/app/layout.tsx
- [ ] T034 Main application entry point in src/main.tsx

## Phase 3.7: Integration and Styling
- [ ] T035 Connect FileSelector to file reading services
- [ ] T036 Connect JsonViewer to JSON parsing services
- [ ] T037 Implement TanStack Query for state management
- [ ] T038 Add error boundaries for error handling
- [ ] T039 [P] Global styles in src/styles/globals.css
- [ ] T040 [P] Component-specific styles
- [ ] T041 Implement responsive design

## Phase 3.8: Polish and Optimization
- [ ] T042 [P] Unit tests for utilities in tests/unit/lib/
- [ ] T043 [P] Unit tests for hooks in tests/unit/hooks/
- [ ] T044 [P] Unit tests for components in tests/unit/components/
- [ ] T045 Performance optimization for large JSON files
- [ ] T046 Accessibility features (ARIA labels, keyboard navigation)
- [ ] T047 Search functionality implementation
- [ ] T048 Copy to clipboard functionality
- [ ] T049 Dark/light theme toggle
- [ ] T050 Documentation and README updates

## Dependencies
- Tests (T005-T009) before implementation (T010-T034)
- Models (T010-T015) before services (T016-T018)
- Services (T016-T018) before components (T019-T024)
- Hooks (T025-T028) after core utilities
- Pages (T030-T034) after components and hooks
- Integration (T035-T041) after all core pieces
- Polish (T042-T050) after integration complete

## Parallel Example
```
# Launch T005-T009 together:
Task: "Contract test file validation in tests/contract/test-file-validation.ts"
Task: "Contract test JSON parsing in tests/contract/test-json-parsing.ts"
Task: "Integration test file upload workflow in tests/integration/test-file-upload.tsx"
Task: "Integration test JSON viewer component in tests/integration/test-json-viewer.tsx"
Task: "Performance test large file handling in tests/performance/test-file-performance.ts"

# After tests fail, launch T010-T015 together:
Task: "JsonFile entity model in src/lib/models/JsonFile.ts"
Task: "JsonDocument entity model in src/lib/models/JsonDocument.ts"
Task: "JsonNode entity model in src/lib/models/JsonNode.ts"
Task: "File parsing utilities in src/lib/fileParser.ts"
Task: "JSON extraction utilities in src/lib/jsonExtractor.ts"
Task: "Type definitions in src/lib/types.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts
- Follow TanStack Start conventions and best practices

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - file-processing.json → file validation contract test [P]
   - file-processing.json → JSON parsing contract test [P]

2. **From Data Model**:
   - JsonFile entity → model creation task [P]
   - JsonDocument entity → model creation task [P]
   - JsonNode entity → model creation task [P]

3. **From User Stories**:
   - File reading workflow → integration test [P]
   - JSON viewing workflow → integration test [P]
   - Error handling scenarios → integration test [P]

4. **From Technical Decisions**:
   - TanStack Start setup → project initialization task
   - Client-side processing → file utilities tasks
   - Performance requirements → performance test task

5. **Ordering**:
   - Setup → Tests → Models → Services → Components → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests
- [x] All entities have model tasks
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TanStack ecosystem properly integrated
- [x] Performance requirements addressed
- [x] Accessibility considerations included