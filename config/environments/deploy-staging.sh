#!/bin/bash

# =============================================================================
# Parsify Staging Environment Deployment Script
# =============================================================================
# This script deploys the application to the staging environment
# Usage: ./deploy-staging.sh [--skip-tests] [--force]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="staging"
PROJECT_NAME="parsify-dev"
API_SCRIPT_NAME="parsify-api-staging"
WEB_PROJECT_NAME="parsify-dev-staging"
REGION="iad1"

# Parse command line arguments
SKIP_TESTS=false
FORCE_DEPLOY=false
ROLLBACK=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --force)
      FORCE_DEPLOY=true
      shift
      ;;
    --rollback)
      ROLLBACK=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--skip-tests] [--force] [--rollback]"
      echo "  --skip-tests  Skip running tests before deployment"
      echo "  --force       Force deployment even if health checks fail"
      echo "  --rollback    Rollback to previous deployment"
      echo "  -h, --help    Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."

  # Check if required tools are installed
  if ! command -v wrangler &> /dev/null; then
    log_error "Wrangler CLI is not installed. Please install it with: npm install -g wrangler"
    exit 1
  fi

  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
  fi

  if ! command -v pnpm &> /dev/null; then
    log_error "pnpm is not installed"
    exit 1
  fi

  # Check if we're in the right directory
  if [[ ! -f "package.json" ]]; then
    log_error "Please run this script from the project root directory"
    exit 1
  fi

  # Check if environment variables are set
  if [[ ! -f ".env.staging" ]]; then
    log_warning ".env.staging file not found. Using environment variables from shell."
  fi

  log_success "Prerequisites check passed"
}

# Load environment variables
load_environment() {
  log_info "Loading environment variables..."

  # Load from .env.staging if it exists
  if [[ -f ".env.staging" ]]; then
    export $(cat .env.staging | grep -v '^#' | xargs)
  fi

  # Set required environment variables if not set
  export ENVIRONMENT=$ENVIRONMENT
  export NODE_ENV=$ENVIRONMENT

  log_success "Environment variables loaded"
}

# Run tests
run_tests() {
  if [[ "$SKIP_TESTS" == true ]]; then
    log_warning "Skipping tests as requested"
    return 0
  fi

  log_info "Running tests..."

  # Install dependencies
  log_info "Installing dependencies..."
  pnpm install

  # Run linting
  log_info "Running linting..."
  pnpm run lint

  # Run type checking
  log_info "Running type checking..."
  pnpm run type-check

  # Run unit tests
  log_info "Running unit tests..."
  pnpm run test

  # Run integration tests
  log_info "Running integration tests..."
  pnpm run test:e2e

  log_success "All tests passed"
}

# Build application
build_application() {
  log_info "Building application..."

  # Build all packages
  pnpm run build

  log_success "Application built successfully"
}

# Validate environment configuration
validate_configuration() {
  log_info "Validating environment configuration..."

  # Validate environment configuration
  node -e "
    import('./staging.js').then(({ validateStagingConfig }) => {
      if (!validateStagingConfig()) {
        console.error('Staging environment configuration is invalid');
        process.exit(1);
      }
      console.log('Environment configuration is valid');
    }).catch(err => {
      console.error('Error validating configuration:', err);
      process.exit(1);
    });
  " || {
    log_error "Environment configuration validation failed"
    exit 1
  }

  log_success "Environment configuration is valid"
}

# Deploy API to Cloudflare Workers
deploy_api() {
  log_info "Deploying API to Cloudflare Workers..."

  cd apps/api

  # Deploy to staging
  wrangler deploy --env staging

  # Verify deployment
  log_info "Verifying API deployment..."
  API_URL="https://api-staging.parsify.dev"
  if curl -f "$API_URL/health" > /dev/null 2>&1; then
    log_success "API deployment verified successfully"
  else
    log_error "API health check failed"
    if [[ "$FORCE_DEPLOY" != true ]]; then
      exit 1
    fi
    log_warning "Continuing deployment despite health check failure (force mode)"
  fi

  cd - > /dev/null
  log_success "API deployed successfully"
}

# Deploy Web App to Cloudflare Pages
deploy_web() {
  log_info "Deploying web app to Cloudflare Pages..."

  # Build web app
  cd apps/web
  pnpm run build

  # Deploy to Pages
  wrangler pages deploy dist --project-name $WEB_PROJECT_NAME --env staging

  # Verify deployment
  log_info "Verifying web app deployment..."
  WEB_URL="https://staging.parsify.dev"
  if curl -f "$WEB_URL" > /dev/null 2>&1; then
    log_success "Web app deployment verified successfully"
  else
    log_error "Web app health check failed"
    if [[ "$FORCE_DEPLOY" != true ]]; then
      exit 1
    fi
    log_warning "Continuing deployment despite health check failure (force mode)"
  fi

  cd - > /dev/null
  log_success "Web app deployed successfully"
}

# Update DNS records
update_dns() {
  log_info "Updating DNS records..."

  # This would typically be handled by Terraform or similar infrastructure-as-code
  # For now, we'll just log the action
  log_warning "DNS updates should be handled by infrastructure-as-code tools"
  log_info "DNS records for staging:"
  log_info "  - staging.parsify.dev -> Cloudflare Pages"
  log_info "  - api-staging.parsify.dev -> Cloudflare Workers"
}

# Run health checks
run_health_checks() {
  log_info "Running comprehensive health checks..."

  API_URL="https://api-staging.parsify.dev"
  WEB_URL="https://staging.parsify.dev"

  # API health checks
  log_info "Checking API health..."
  API_ENDPOINTS=(
    "/health"
    "/api/v1/health"
    "/api/v1/status"
  )

  for endpoint in "${API_ENDPOINTS[@]}"; do
    if curl -f "$API_URL$endpoint" > /dev/null 2>&1; then
      log_success "API endpoint $endpoint is healthy"
    else
      log_error "API endpoint $endpoint failed health check"
      if [[ "$FORCE_DEPLOY" != true ]]; then
        exit 1
      fi
    fi
  done

  # Web app health checks
  log_info "Checking web app health..."
  if curl -f "$WEB_URL" > /dev/null 2>&1; then
    log_success "Web app is healthy"
  else
    log_error "Web app failed health check"
    if [[ "$FORCE_DEPLOY" != true ]]; then
      exit 1
    fi
  fi

  log_success "All health checks passed"
}

# Run smoke tests
run_smoke_tests() {
  log_info "Running smoke tests..."

  API_URL="https://api-staging.parsify.dev"
  WEB_URL="https://staging.parsify.dev"

  # Test API endpoints
  log_info "Testing API endpoints..."

  # Test JSON formatting
  if curl -X POST "$API_URL/api/v1/json/format" \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}' \
    -f > /dev/null 2>&1; then
    log_success "JSON formatting endpoint works"
  else
    log_error "JSON formatting endpoint failed"
    exit 1
  fi

  # Test file upload
  if curl -X POST "$API_URL/api/v1/upload" \
    -F "file=@tests/fixtures/sample.json" \
    -f > /dev/null 2>&1; then
    log_success "File upload endpoint works"
  else
    log_warning "File upload endpoint failed (might be expected in staging)"
  fi

  log_success "Smoke tests completed"
}

# Rollback function
rollback() {
  log_warning "Rolling back deployment..."

  # This is a simplified rollback implementation
  # In practice, you'd want to:
  # 1. Keep track of previous deployment versions
  # 2. Have automated rollback procedures
  # 3. Database migrations rollback

  cd apps/api
  wrangler rollback --env staging || log_warning "Rollback command not available, manual intervention required"
  cd - > /dev/null

  log_warning "Rollback completed. Please verify the application is working correctly."
}

# Main deployment flow
main() {
  echo "=============================================================================="
  echo "Parsify Staging Environment Deployment"
  echo "=============================================================================="

  if [[ "$ROLLBACK" == true ]]; then
    rollback
    exit 0
  fi

  check_prerequisites
  load_environment

  if [[ "$SKIP_TESTS" != true ]]; then
    run_tests
  fi

  build_application
  validate_configuration
  deploy_api
  deploy_web
  update_dns
  run_health_checks
  run_smoke_tests

  echo "=============================================================================="
  log_success "Staging deployment completed successfully!"
  echo "=============================================================================="
  echo "Staging URLs:"
  echo "  Web App: https://staging.parsify.dev"
  echo "  API: https://api-staging.parsify.dev"
  echo "  API Docs: https://api-staging.parsify.dev/docs"
  echo "=============================================================================="
}

# Error handling
trap 'log_error "Deployment failed. Please check the logs above."' ERR

# Run main function
main "$@"
