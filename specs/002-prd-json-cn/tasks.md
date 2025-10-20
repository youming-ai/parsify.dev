# Tasks: Online Developer Tools Platform

**Input**: Design documents from `/specs/002-prd-json-cn/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Monorepo**: `apps/web/`, `apps/api/`, `packages/`
- **Web app**: `apps/web/src/`, `apps/api/src/`
- **Tests**: `tests/contract/`, `tests/integration/`, `tests/unit/`

## Phase 3.1: Infrastructure & Setup
- [x] T001 Create monorepo structure with pnpm workspaces
- [x] T002 Initialize TypeScript configuration for all packages
- [x] T003 [P] Set up Next.js 14 frontend in apps/web/ with App Router
- [x] T004 [P] Set up Hono API backend in apps/api/
- [x] T005 [P] Configure shared packages (schemas, ui, utils)
- [x] T006 Configure Cloudflare services (D1, KV, R2, Durable Objects)
- [x] T007 [P] Set up development environment and tooling (ESLint, Prettier, Husky)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests
- [x] T008 [P] Contract test GET /api/v1/tools in tests/contract/test_tools_get.ts
- [x] T009 [P] Contract test POST /api/v1/tools/json/format in tests/contract/test_json_format.ts
- [x] T010 [P] Contract test POST /api/v1/tools/json/validate in tests/contract/test_json_validate.ts
- [x] T011 [P] Contract test POST /api/v1/tools/json/convert in tests/contract/test_json_convert.ts
- [x] T012 [P] Contract test POST /api/v1/tools/code/format in tests/contract/test_code_format.ts
- [x] T013 [P] Contract test POST /api/v1/tools/code/execute in tests/contract/test_code_execute.ts
- [x] T014 [P] Contract test POST /api/v1/upload/sign in tests/contract/test_upload.ts
- [x] T015 [P] Contract test POST /api/v1/jobs in tests/contract/test_jobs.ts
- [x] T016 [P] Contract test GET /api/v1/jobs/{id} in tests/contract/test_jobs_get.ts

### Integration Tests
- [x] T017 [P] Integration test JSON formatting workflow in tests/integration/test_json_workflow.ts
- [x] T018 [P] Integration test code execution workflow in tests/integration/test_code_execution.ts
- [x] T019 [P] Integration test file upload/download workflow in tests/integration/test_file_workflow.ts
- [x] T020 [P] Integration test authentication flow in tests/integration/test_auth_flow.ts
- [x] T021 [P] Integration test rate limiting in tests/integration/test_rate_limiting.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database Layer
- [x] T022 [P] User model in apps/api/src/models/user.ts
- [x] T023 [P] AuthIdentity model in apps/api/src/models/auth_identity.ts
- [x] T024 [P] Tool model in apps/api/src/models/tool.ts
- [x] T025 [P] ToolUsage model in apps/api/src/models/tool_usage.ts
- [x] T026 [P] Job model in apps/api/src/models/job.ts
- [x] T027 [P] FileUpload model in apps/api/src/models/file_upload.ts
- [x] T028 [P] QuotaCounter model in apps/api/src/models/quota_counter.ts
- [x] T029 [P] AuditLog model in apps/api/src/models/audit_log.ts
- [x] T030 Create database migrations in migrations/

### API Services Layer
- [x] T031 [P] UserService in apps/api/src/services/user_service.ts
- [x] T032 [P] AuthService in apps/api/src/services/auth_service.ts
- [x] T033 [P] ToolService in apps/api/src/services/tool_service.ts
- [x] T034 [P] JobService in apps/api/src/services/job_service.ts
- [x] T035 [P] FileService in apps/api/src/services/file_service.ts
- [x] T036 [P] RateLimitService in apps/api/src/services/rate_limit_service.ts

### API Routes
- [x] T037 Tools routes in apps/api/src/routes/tools.ts
- [x] T038 JSON tool routes (integrated in tools.ts)
- [x] T039 Code tool routes (integrated in tools.ts)
- [x] T040 File upload routes in apps/api/src/routes/upload.ts
- [x] T041 Job management routes in apps/api/src/routes/jobs.ts
- [x] T042 Authentication routes in apps/api/src/routes/auth.ts
- [x] T043 User management routes in apps/api/src/routes/users.ts

### Frontend Components
- [x] T044 [P] Layout components in apps/web/src/components/layout/
- [x] T045 [P] Tool components in apps/web/src/components/tools/
- [x] T046 [P] JSON tool components in apps/web/src/components/tools/json/
- [x] T047 [P] Code execution components in apps/web/src/components/tools/code/
- [x] T048 [P] File upload components in apps/web/src/components/file-upload/
- [x] T049 [P] Authentication components in apps/web/src/components/auth/

### Frontend Pages
- [x] T050 Home page in apps/web/src/app/page.tsx
- [x] T051 Tools listing page in apps/web/src/app/tools/page.tsx
- [x] T052 JSON tools page in apps/web/src/app/tools/json/page.tsx
- [x] T053 Code execution page in apps/web/src/app/tools/code/page.tsx
- [x] T054 [P] Tool pages in apps/web/src/app/tools/[slug]/page.tsx
- [x] T055 Authentication pages in apps/web/src/app/auth/

### Tool Implementation
- [x] T056 JSON formatting service in apps/api/src/wasm/json_formatter.ts
- [x] T057 JSON validation service in apps/api/src/wasm/json_validator.ts
- [x] T058 JSON conversion service in apps/api/src/wasm/json_converter.ts
- [x] T059 Code formatting service in apps/api/src/wasm/code_formatter.ts
- [x] T060 Code execution service in apps/api/src/wasm/code_executor.ts
- [x] T061 [P] WASM modules in apps/api/src/wasm/modules/

## Phase 3.4: Integration & Security

### Database Integration
- [x] T062 Connect services to D1 database
- [x] T063 Implement database connection pooling
- [x] T064 Add database transaction support
- [x] T065 Set up database migrations runner

### Middleware & Security
- [x] T066 Authentication middleware in apps/api/src/middleware/auth.ts
- [x] T067 Rate limiting middleware in apps/api/src/middleware/rate_limit.ts
- [x] T068 Error handling middleware in apps/api/src/middleware/error.ts
- [x] T069 Request logging middleware in apps/api/src/middleware/logging.ts
- [x] T070 CORS and security headers middleware
- [x] T071 Turnstile integration for bot protection

### Cloudflare Integration
- [x] T072 R2 file storage integration
- [x] T073 KV cache integration
- [x] T074 Durable Objects for session management
- [x] T075 Queue system for async job processing
- [x] T076 Cloudflare Images integration

## Phase 3.5: Polish & Performance

### Unit Tests
- [x] T077 [P] Unit tests for models in tests/unit/models/
- [x] T078 [P] Unit tests for services in tests/unit/services/
- [x] T079 [P] Unit tests for utilities in tests/unit/utils/
- [x] T080 [P] Unit tests for WASM modules in tests/unit/wasm/
- [x] T081 [P] Unit tests for components in tests/unit/components/

### Performance & Monitoring
- [x] T082 Performance tests for API endpoints (<200ms p95)
- [x] T083 Load testing for concurrent users
- [x] T084 Memory usage optimization for WASM modules
- [x] T085 Add Sentry error tracking
- [x] T086 Set up Cloudflare Analytics monitoring
- [x] T087 Add health check endpoints

### Documentation & Deployment
- [x] T088 [P] Update README.md with setup instructions
- [x] T089 [P] API documentation in docs/api/
- [x] T090 [P] Component documentation in docs/components/
- [x] T091 [P] Deployment scripts in scripts/
- [x] T092 Set up GitHub Actions CI/CD
- [x] T093 Configure staging and production environments
- [x] T094 Create deployment runbooks

## Dependencies

### Critical Dependencies
- T008-T021 (Tests) → T022-T061 (Implementation)
- T022-T030 (Models) → T031-T036 (Services)
- T031-T036 (Services) → T037-T043 (Routes)
- T062-T065 (Database) → All service implementations
- T066-T071 (Middleware) → All route implementations
- T072-T076 (Cloudflare) → File and job processing features

### Parallel Execution Groups
```
# Group 1: Setup (can run in parallel)
T003, T004, T005, T007

# Group 2: Contract Tests (can run in parallel)
T008, T009, T010, T011, T012, T013, T014, T015, T016

# Group 3: Integration Tests (can run in parallel)
T017, T018, T019, T020, T021

# Group 4: Models (can run in parallel)
T022, T023, T024, T025, T026, T027, T028, T029

# Group 5: Services (can run in parallel)
T031, T032, T033, T034, T035, T036

# Group 6: Routes (can run in parallel after services)
T037, T038, T039, T040, T041, T042, T043

# Group 7: Frontend Components (can run in parallel)
T044, T045, T046, T047, T048, T049

# Group 8: Tool Implementation (can run in parallel)
T056, T057, T058, T059, T060

# Group 9: Unit Tests (can run in parallel)
T077, T078, T079, T080, T081

# Group 10: Documentation (can run in parallel)
T088, T089, T090, T091
```

## Parallel Execution Examples

### Example 1: Initial Setup
```bash
# Launch setup tasks in parallel
Task: "Set up Next.js 14 frontend in apps/web/ with App Router"
Task: "Set up Hono API backend in apps/api/"
Task: "Configure shared packages (schemas, ui, utils)"
Task: "Set up development environment and tooling (ESLint, Prettier, Husky)"
```

### Example 2: Contract Tests
```bash
# Launch all contract tests in parallel
Task: "Contract test GET /api/v1/tools in tests/contract/test_tools_get.ts"
Task: "Contract test POST /api/v1/tools/json/format in tests/contract/test_json_format.ts"
Task: "Contract test POST /api/v1/tools/json/validate in tests/contract/test_json_validate.ts"
Task: "Contract test POST /api/v1/tools/code/format in tests/contract/test_code_format.ts"
```

### Example 3: Model Creation
```bash
# Launch all model tasks in parallel
Task: "User model in apps/api/src/models/user.ts"
Task: "AuthIdentity model in apps/api/src/models/auth_identity.ts"
Task: "Tool model in apps/api/src/models/tool.ts"
Task: "Job model in apps/api/src/models/job.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (TDD principle)
- Commit after each task completion
- Run `pnpm test` after each implementation task
- Focus on MVP features first (JSON tools, basic code execution)
- Ensure all tasks include exact file paths
- Avoid vague tasks or same file conflicts

## Validation Checklist
- [x] All contracts have corresponding tests
- [x] All entities have model tasks
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Dependencies clearly documented
- [x] MVP scope clearly defined
- [x] Performance requirements included
- [x] Security considerations addressed