# Makefile for GitHub Actions Workflows and Development Tasks

.PHONY: help install test build lint format type-check security deploy-staging deploy-production release backup clean docs

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development Commands
install: ## Install all dependencies
	pnpm install

test: ## Run all tests
	pnpm test

test:coverage: ## Run tests with coverage
	pnpm test:coverage

test:watch: ## Run tests in watch mode
	pnpm test:watch

test:e2e: ## Run end-to-end tests
	pnpm test:e2e

test:performance: ## Run performance tests
	pnpm test:performance

build: ## Build all applications
	pnpm build

lint: ## Run linting
	pnpm lint

lint:fix: ## Fix linting issues
	pnpm lint:fix

format: ## Format code
	pnpm format

type-check: ## Run type checking
	pnpm type-check

# Security Commands
security:audit: ## Run security audit
	pnpm audit

security:scan: ## Run comprehensive security scan
	@echo "Running security scan locally..."
	@echo "Note: Full security scan requires GitHub Actions environment"
	npm audit --audit-level high

security:fix: ## Fix security issues
	pnpm audit --fix

# Database Commands
db:migrate: ## Run database migrations
	pnpm db:migrate

db:seed: ## Seed database
	pnpm db:seed

db:backup: ## Create database backup
	@echo "Creating database backup..."
	@echo "Note: Database backup requires proper environment configuration"

# Deployment Commands
deploy:staging: ## Deploy to staging environment
	@echo "Deploying to staging..."
	@echo "Note: Use GitHub Actions for deployment: Push to develop branch"
	@echo "Or run: gh workflow run deploy-staging.yml"

deploy:production: ## Deploy to production environment
	@echo "Deploying to production..."
	@echo "Note: Use GitHub Actions for deployment:"
	@echo "1. Create and push a version tag: git tag v1.0.0 && git push origin v1.0.0"
	@echo "2. Or run manual deployment: gh workflow run deploy-production.yml"

# Release Commands
release:patch: ## Create patch release
	@echo "Creating patch release..."
	gh workflow run release.yml -f release_type=patch -f deploy_to_production=false

release:minor: ## Create minor release
	@echo "Creating minor release..."
	gh workflow run release.yml -f release_type=minor -f deploy_to_production=false

release:major: ## Create major release
	@echo "Creating major release..."
	gh workflow run release.yml -f release_type=major -f deploy_to_production=false

release:pre: ## Create pre-release
	@echo "Creating pre-release..."
	gh workflow run release.yml -f release_type=pre-release -f deploy_to_production=false

# Workflow Commands
workflows:list: ## List all GitHub Actions workflows
	gh workflow list

workflows:run:ci: ## Run CI workflow manually
	gh workflow run ci.yml

workflows:run:security: ## Run security scan manually
	gh workflow run security-scan.yml

workflows:run:performance: ## Run performance tests manually
	gh workflow run performance-tests.yml

workflows:run:monitoring: ## Run monitoring checks manually
	gh workflow run monitoring.yml

workflows:run:database: ## Run database operations
	@echo "Running database operations..."
	gh workflow run database.yml -f operation=migrate -f environment=staging

# Development Setup
setup:dev: ## Set up development environment
	@echo "Setting up development environment..."
	chmod +x scripts/setup-workflows.sh
	./scripts/setup-workflows.sh

setup:secrets: ## Guide through secret setup
	@echo "Setting up GitHub secrets..."
	@echo "Please follow the interactive setup script"
	./scripts/setup-workflows.sh

# Quality Assurance
qa:all: ## Run all quality checks
	@echo "Running all quality checks..."
	make lint
	make type-check
	make test
	make security:audit
	make build

qa:pre-commit: ## Run pre-commit checks
	@echo "Running pre-commit checks..."
	make lint
	make format
	make type-check
	make test

# Documentation
docs:generate: ## Generate documentation
	@echo "Generating documentation..."
	@echo "Documentation generation not yet implemented"

docs:serve: ## Serve documentation locally
	@echo "Serving documentation locally..."
	@echo "Documentation serving not yet implemented"

# Cleanup Commands
clean: ## Clean build artifacts and dependencies
	@echo "Cleaning build artifacts..."
	rm -rf node_modules/
	rm -rf apps/*/node_modules/
	rm -rf packages/*/node_modules/
	rm -rf .next/
	rm -rf dist/
	rm -rf build/
	rm -rf coverage/
	find . -name "*.log" -delete

clean:artifacts: ## Clean GitHub Actions artifacts locally
	@echo "Cleaning local artifacts..."
	rm -rf release-artifacts/
	rm -rf deployment-packages/
	rm -rf performance-reports/
	rm -rf security-reports/
	rm -rf analytics-results/

# Monitoring Commands
monitor:local: ## Run local monitoring checks
	@echo "Running local monitoring checks..."
	@echo "Note: Full monitoring requires GitHub Actions environment"

monitor:health: ## Check application health
	@echo "Checking application health..."
	@echo "Note: Health checks require running application"

# Backup Commands
backup:local: ## Create local backup
	@echo "Creating local backup..."
	mkdir -p backups
	tar -czf backups/backup-$(shell date +%Y%m%d-%H%M%S).tar.gz \
		--exclude=node_modules \
		--exclude=.git \
		--exclude=dist \
		--exclude=build \
		--exclude=.next \
		.

backup:restore: ## Restore from backup (usage: make backup:restore BACKUP_FILE=backups/backup-20231201-120000.tar.gz)
	@echo "Restoring from backup..."
	@if [ -z "$(BACKUP_FILE)" ]; then echo "Usage: make backup:restore BACKUP_FILE=backups/backup-20231201-120000.tar.gz"; exit 1; fi
	tar -xzf $(BACKUP_FILE)

# Utility Commands
version:check: ## Check current version
	@echo "Current version: $(shell node -p 'require("./package.json").version')"

version:update: ## Update version (usage: make version:update VERSION=1.0.0)
	@if [ -z "$(VERSION)" ]; then echo "Usage: make version:update VERSION=1.0.0"; exit 1; fi
	npm version $(VERSION) --no-git-tag-version

deps:check: ## Check for outdated dependencies
	pnpm outdated

deps:update: ## Update dependencies
	pnpm update

# Quick Development Workflow
dev:setup: ## Quick development setup
	@echo "Setting up for development..."
	make install
	make build

dev:start: ## Start development server
	pnpm dev

dev:full: ## Full development workflow
	make dev:setup
	make dev:start

# Production Deployment Workflow
prod:deploy: ## Full production deployment workflow
	@echo "Starting production deployment workflow..."
	@echo "This will:"
	@echo "1. Run all quality checks"
	@echo "2. Create a new release"
	@echo "3. Deploy to production"
	@echo ""
	@read -p "Continue? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	make qa:all
	make release:patch

# Status Commands
status:workflows: ## Show workflow status
	gh run list --limit 10

status:environments: ## Show deployment environments
	@echo "Checking environment status..."
	@echo "Staging: https://staging.parsify.dev"
	@echo "Production: https://parsify.dev"

status:secrets: ## Show configured secrets
	gh secret list

# GitHub Actions Helpers
gh:workflow:dispatch: ## Dispatch workflow (usage: make gh:workflow:dispatch WORKFLOW=ci.yml)
	@if [ -z "$(WORKFLOW)" ]; then echo "Usage: make gh:workflow:dispatch WORKFLOW=ci.yml"; exit 1; fi
	gh workflow run $(WORKFLOW)

gh:run:logs: ## Show logs for a workflow run (usage: make gh:run:logs RUN_ID=123456789)
	@if [ -z "$(RUN_ID)" ]; then echo "Usage: make gh:run:logs RUN_ID=123456789"; exit 1; fi
	gh run view $(RUN_ID) --log

gh:run:rerun: ## Rerun a workflow run (usage: make gh:run:rerun RUN_ID=123456789)
	@if [ -z "$(RUN_ID)" ]; then echo "Usage: make gh:run:rerun RUN_ID=123456789"; exit 1; fi
	gh run rerun $(RUN_ID)

# Project-specific commands
project:info: ## Show project information
	@echo "Project: Parsify.dev"
	@echo "Repository: $(shell git config --get remote.origin.url)"
	@echo "Current Branch: $(shell git branch --show-current)"
	@echo "Last Commit: $(shell git log -1 --oneline)"
	@echo "Node Version: $(shell node --version)"
	@echo "PNPM Version: $(shell pnpm --version)"

project:health: ## Check overall project health
	@echo "Checking project health..."
	@echo "=== Repository Status ==="
	@git status --porcelain | wc -l | xargs -I {} echo "Modified files: {}"
	@echo "=== Dependencies ==="
	@pnpm audit --audit-level high 2>/dev/null | grep -c "found" | xargs -I {} echo "High vulnerabilities: {}" || echo "High vulnerabilities: 0"
	@echo "=== Build Status ==="
	@make build > /dev/null 2>&1 && echo "Build: ✅ Success" || echo "Build: ❌ Failed"
	@echo "=== Test Status ==="
	@make test > /dev/null 2>&1 && echo "Tests: ✅ Success" || echo "Tests: ❌ Failed"
