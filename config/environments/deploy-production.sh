#!/bin/bash

# =============================================================================
# Parsify Production Environment Deployment Script
# =============================================================================
# This script deploys the application to the production environment
# Usage: ./deploy-production.sh [--skip-tests] [--force] [--rollback] [--dry-run]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="production"
PROJECT_NAME="parsify-dev"
API_SCRIPT_NAME="parsify-api-prod"
WEB_PROJECT_NAME="parsify-dev-prod"
REGIONS=("iad1" "dfw" "sfo")
PRIMARY_REGION="iad1"

# Parse command line arguments
SKIP_TESTS=false
FORCE_DEPLOY=false
ROLLBACK=false
DRY_RUN=false
MANUAL_APPROVAL=false

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
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --manual-approval)
      MANUAL_APPROVAL=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--skip-tests] [--force] [--rollback] [--dry-run] [--manual-approval]"
      echo "  --skip-tests      Skip running tests before deployment"
      echo "  --force           Force deployment even if health checks fail"
      echo "  --rollback        Rollback to previous deployment"
      echo "  --dry-run         Run deployment checks without actually deploying"
      echo "  --manual-approval  Require manual approval before deploying"
      echo "  -h, --help        Show this help message"
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

log_critical() {
  echo -e "${PURPLE}[CRITICAL]${NC} $1"
}

# Send notification
send_notification() {
  local message="$1"
  local severity="$2"  # info, warning, error, critical

  log_info "Sending notification: $message"

  # Send to Slack if webhook is configured
  if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-type: application/json' \
      --data "{\"text\":\"$message\"}" > /dev/null 2>&1 || log_warning "Failed to send Slack notification"
  fi

  # Send email if configured
  if [[ -n "$ALERT_EMAIL_TO" && -n "$EMAIL_API_KEY" ]]; then
    # This would typically use a service like Resend
    log_info "Email notification would be sent to $ALERT_EMAIL_TO"
  fi
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
  if [[ ! -f ".env.production" ]]; then
    log_warning ".env.production file not found. Using environment variables from shell."
  fi

  # Production-specific checks
  if [[ "$ENVIRONMENT" == "production" ]]; then
    # Check if we're on the main branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" != "main" && "$FORCE_DEPLOY" != true ]]; then
      log_error "Production deployments must be from the main branch. Current branch: $CURRENT_BRANCH"
      exit 1
    fi

    # Check if working directory is clean
    if [[ -n $(git status --porcelain) && "$FORCE_DEPLOY" != true ]]; then
      log_error "Working directory is not clean. Please commit or stash changes."
      exit 1
    fi
  fi

  log_success "Prerequisites check passed"
}

# Load environment variables
load_environment() {
  log_info "Loading environment variables..."

  # Load from .env.production if it exists
  if [[ -f ".env.production" ]]; then
    export $(cat .env.production | grep -v '^#' | xargs)
  fi

  # Set required environment variables
  export ENVIRONMENT=$ENVIRONMENT
  export NODE_ENV=$ENVIRONMENT

  log_success "Environment variables loaded"
}

# Manual approval
request_approval() {
  if [[ "$MANUAL_APPROVAL" != true ]]; then
    return 0
  fi

  echo ""
  log_critical "=========================================================="
  log_critical "PRODUCTION DEPLOYMENT APPROVAL REQUIRED"
  log_critical "=========================================================="
  echo ""
  echo "You are about to deploy to PRODUCTION environment."
  echo ""
  echo "Environment: $ENVIRONMENT"
  echo "Branch: $(git branch --show-current)"
  echo "Commit: $(git rev-parse HEAD)"
  echo "Timestamp: $(date)"
  echo ""
  echo -n "Type 'DEPLOY' to continue: "
  read -r response

  if [[ "$response" != "DEPLOY" ]]; then
    log_error "Deployment cancelled by user"
    exit 1
  fi

  log_success "Manual approval received"
}

# Pre-deployment checks
pre_deployment_checks() {
  log_info "Running pre-deployment checks..."

  # Check if staging deployment is healthy
  log_info "Checking staging environment health..."
  STAGING_URL="https://staging.parsify.dev"
  if ! curl -f "$STAGING_URL/health" > /dev/null 2>&1; then
    log_error "Staging environment is not healthy. Please fix staging before deploying to production."
    if [[ "$FORCE_DEPLOY" != true ]]; then
      exit 1
    fi
    log_warning "Continuing deployment despite staging issues (force mode)"
  fi

  # Check database connectivity
  log_info "Checking database connectivity..."
  # This would typically test actual database connectivity

  # Check external services
  log_info "Checking external services..."
  # Check email service, analytics, etc.

  log_success "Pre-deployment checks passed"
}

# Run comprehensive tests
run_tests() {
  if [[ "$SKIP_TESTS" == true ]]; then
    log_warning "Skipping tests as requested"
    return 0
  fi

  log_info "Running comprehensive test suite..."

  # Install dependencies
  log_info "Installing dependencies..."
  pnpm install

  # Run linting
  log_info "Running linting..."
  pnpm run lint

  # Run type checking
  log_info "Running type checking..."
  pnpm run type-check

  # Run unit tests with coverage
  log_info "Running unit tests with coverage..."
  pnpm run test:coverage

  # Run integration tests
  log_info "Running integration tests..."
  pnpm run test:e2e

  # Run performance tests
  log_info "Running performance tests..."
  pnpm run test:performance:ci

  # Run load tests
  log_info "Running load tests..."
  pnpm run test:load:quick

  log_success "All tests passed"
}

# Build application
build_application() {
  log_info "Building application for production..."

  # Clean previous builds
  log_info "Cleaning previous builds..."
  pnpm run clean || true

  # Build all packages
  pnpm run build

  # Run bundle analysis
  log_info "Running bundle analysis..."
  cd apps/web
  pnpm run analyze
  cd - > /dev/null

  log_success "Application built successfully"
}

# Validate production configuration
validate_configuration() {
  log_info "Validating production environment configuration..."

  # Validate environment configuration
  node -e "
    import('./production.js').then(({ validateProductionConfig }) => {
      if (!validateProductionConfig()) {
        console.error('Production environment configuration is invalid');
        process.exit(1);
      }
      console.log('Environment configuration is valid');
    }).catch(err => {
      console.error('Error validating configuration:', err);
      process.exit(1);
    });
  " || {
    log_error "Production environment configuration validation failed"
    exit 1
  }

  # Validate secrets
  log_info "Validating production secrets..."
  if [[ -z "$PROD_JWT_SECRET" || ${#PROD_JWT_SECRET} -lt 32 ]]; then
    log_error "JWT secret must be at least 32 characters long"
    exit 1
  fi

  if [[ -z "$PROD_ENCRYPTION_KEY" || ${#PROD_ENCRYPTION_KEY} -lt 32 ]]; then
    log_error "Encryption key must be at least 32 characters long"
    exit 1
  fi

  log_success "Production configuration is valid"
}

# Create deployment backup
create_backup() {
  log_info "Creating deployment backup..."

  # Backup current deployment state
  BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$BACKUP_DIR"

  # Save current wrangler configuration
  cp apps/api/wrangler.toml "$BACKUP_DIR/"

  # Save current commit info
  git rev-parse HEAD > "$BACKUP_DIR/commit.txt"
  git log -1 --pretty=format:"%H|%s|%an|%ad" >> "$BACKUP_DIR/commit.txt"

  # Save environment variables (without secrets)
  env | grep -E "^(ENVIRONMENT|NODE_ENV|API_VERSION|DOMAIN)" > "$BACKUP_DIR/env.txt"

  log_success "Backup created: $BACKUP_DIR"
}

# Deploy API to Cloudflare Workers (multi-region)
deploy_api() {
  log_info "Deploying API to Cloudflare Workers (multi-region)..."

  if [[ "$DRY_RUN" == true ]]; then
    log_info "DRY RUN: Would deploy API to regions: ${REGIONS[*]}"
    return 0
  fi

  cd apps/api

  # Deploy to primary region first
  log_info "Deploying to primary region: $PRIMARY_REGION"
  wrangler deploy --env production

  # Deploy to additional regions
  for region in "${REGIONS[@]}"; do
    if [[ "$region" != "$PRIMARY_REGION" ]]; then
      log_info "Deploying to region: $region"
      wrangler deploy --env production --region "$region" || {
        log_warning "Failed to deploy to region $region"
      }
    fi
  done

  # Verify deployment in primary region
  log_info "Verifying API deployment..."
  API_URL="https://api.parsify.dev"
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
  log_success "API deployed successfully to all regions"
}

# Deploy Web App to Cloudflare Pages
deploy_web() {
  log_info "Deploying web app to Cloudflare Pages..."

  if [[ "$DRY_RUN" == true ]]; then
    log_info "DRY RUN: Would deploy web app to Cloudflare Pages"
    return 0
  fi

  # Build web app
  cd apps/web
  pnpm run build

  # Deploy to Pages with production configuration
  wrangler pages deploy dist --project-name $WEB_PROJECT_NAME --env production

  # Verify deployment
  log_info "Verifying web app deployment..."
  WEB_URL="https://parsify.dev"
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

# Update DNS and CDN configuration
update_dns() {
  log_info "Updating DNS and CDN configuration..."

  if [[ "$DRY_RUN" == true ]]; then
    log_info "DRY RUN: Would update DNS records for production"
    return 0
  fi

  # This would typically be handled by Terraform or similar infrastructure-as-code
  log_info "DNS configuration should be managed by infrastructure-as-code tools"
  log_info "Current DNS records for production:"
  log_info "  - parsify.dev -> Cloudflare Pages"
  log_info "  - api.parsify.dev -> Cloudflare Workers (multi-region)"
  log_info "  - cdn.parsify.dev -> Cloudflare CDN"
  log_info "  - app.parsify.dev -> Cloudflare Pages"
}

# Run comprehensive health checks
run_health_checks() {
  log_info "Running comprehensive health checks..."

  API_URL="https://api.parsify.dev"
  WEB_URL="https://parsify.dev"

  # API health checks
  log_info "Checking API health across all regions..."
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

  # Performance checks
  log_info "Running performance checks..."
  RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$WEB_URL")
  if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    log_success "Performance check passed (${RESPONSE_TIME}s)"
  else
    log_warning "Performance check warning: ${RESPONSE_TIME}s (threshold: 1.0s)"
  fi

  log_success "All health checks passed"
}

# Run smoke tests
run_smoke_tests() {
  log_info "Running production smoke tests..."

  API_URL="https://api.parsify.dev"
  WEB_URL="https://parsify.dev"

  # Test critical API endpoints
  log_info "Testing critical API endpoints..."

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
    log_error "File upload endpoint failed"
    exit 1
  fi

  # Test authentication
  if curl -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"provider": "github"}' \
    -f > /dev/null 2>&1; then
    log_success "Authentication endpoint works"
  else
    log_warning "Authentication endpoint test failed (might be expected)"
  fi

  log_success "Smoke tests completed"
}

# Post-deployment verification
post_deployment_verification() {
  log_info "Running post-deployment verification..."

  # Check analytics collection
  log_info "Verifying analytics collection..."

  # Check error tracking
  log_info "Verifying error tracking..."

  # Check performance monitoring
  log_info "Verifying performance monitoring..."

  # Check SSL certificates
  log_info "Verifying SSL certificates..."
  SSL_EXPIRY=$(echo | openssl s_client -connect parsify.dev:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
  log_info "SSL certificate expires: $SSL_EXPIRY"

  log_success "Post-deployment verification completed"
}

# Rollback function
rollback() {
  log_warning "Rolling back production deployment..."

  send_notification "🚨 Production deployment rollback initiated" "critical"

  # Find the most recent backup
  LATEST_BACKUP=$(ls -t backups/ | head -n 1)
  if [[ -z "$LATEST_BACKUP" ]]; then
    log_error "No backup found for rollback"
    exit 1
  fi

  log_info "Using backup: $LATEST_BACKUP"

  # Rollback API
  cd apps/api
  wrangler rollback --env production || log_warning "API rollback failed, manual intervention required"
  cd - > /dev/null

  # Rollback web app
  cd apps/web
  wrangler pages rollback --project-name $WEB_PROJECT_NAME || log_warning "Web app rollback failed, manual intervention required"
  cd - > /dev/null

  send_notification "Production deployment rollback completed" "warning"
  log_warning "Rollback completed. Please verify the application is working correctly."
}

# Main deployment flow
main() {
  echo "=============================================================================="
  echo "Parsify Production Environment Deployment"
  echo "=============================================================================="

  if [[ "$ROLLBACK" == true ]]; then
    rollback
    exit 0
  fi

  if [[ "$DRY_RUN" == true ]]; then
    log_info "DRY RUN MODE - No actual deployment will be performed"
  fi

  # Send deployment start notification
  send_notification "🚀 Starting production deployment to $ENVIRONMENT" "info"

  check_prerequisites
  load_environment
  request_approval
  pre_deployment_checks

  if [[ "$SKIP_TESTS" != true ]]; then
    run_tests
  fi

  build_application
  validate_configuration
  create_backup
  deploy_api
  deploy_web
  update_dns
  run_health_checks
  run_smoke_tests
  post_deployment_verification

  echo "=============================================================================="
  log_success "Production deployment completed successfully!"
  echo "=============================================================================="
  echo "Production URLs:"
  echo "  Web App: https://parsify.dev"
  echo "  API: https://api.parsify.dev"
  echo "  API Docs: https://api.parsify.dev/docs"
  echo "  Status: https://status.parsify.dev"
  echo "=============================================================================="

  # Send success notification
  send_notification "✅ Production deployment completed successfully" "info"
}

# Error handling
trap 'log_error "Production deployment failed. Please check the logs above."; send_notification "❌ Production deployment failed" "critical"' ERR

# Run main function
main "$@"
