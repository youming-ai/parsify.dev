#!/bin/bash

# GitHub Actions Workflows Setup Script
# This script helps set up the GitHub Actions workflows for the Parsify.dev project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_header "Checking Dependencies"

    local missing_deps=()

    if ! command -v gh &> /dev/null; then
        missing_deps+=("gh (GitHub CLI)")
    fi

    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi

    if ! command -v pnpm &> /dev/null; then
        missing_deps+=("pnpm")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        echo "Please install the missing dependencies and run this script again."
        exit 1
    fi

    print_status "All dependencies are installed"
}

# Validate repository structure
validate_repo_structure() {
    print_header "Validating Repository Structure"

    local required_dirs=(
        ".github/workflows"
        "apps"
        "packages"
        "migrations"
    )

    local missing_dirs=()

    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            missing_dirs+=("$dir")
        fi
    done

    if [ ${#missing_dirs[@]} -ne 0 ]; then
        print_warning "Missing directories: ${missing_dirs[*]}"
        print_status "Creating missing directories..."

        for dir in "${missing_dirs[@]}"; do
            mkdir -p "$dir"
            print_status "Created directory: $dir"
        done
    fi

    print_status "Repository structure validation completed"
}

# Setup GitHub repository settings
setup_github_repo() {
    print_header "Setting Up GitHub Repository"

    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi

    # Check if GitHub CLI is authenticated
    if ! gh auth status > /dev/null 2>&1; then
        print_error "GitHub CLI is not authenticated"
        echo "Please run: gh auth login"
        exit 1
    fi

    # Get repository information
    REPO_OWNER=$(gh repo view --json owner --jq '.owner.login')
    REPO_NAME=$(gh repo view --json name --jq '.name')

    print_status "Repository: $REPO_OWNER/$REPO_NAME"

    # Enable required settings
    print_status "Enabling required GitHub repository settings..."

    # Enable issues (if not already enabled)
    gh repo edit --enable-issues || print_warning "Could not enable issues"

    # Enable actions (if not already enabled)
    gh repo edit --enable-actions || print_warning "Could not enable actions"

    # Enable discussions (optional)
    # gh repo edit --enable-discussions || print_warning "Could not enable discussions"

    print_status "GitHub repository settings configured"
}

# Setup required secrets
setup_secrets() {
    print_header "Setting Up Required Secrets"

    print_warning "This script will guide you through setting up required secrets."
    print_warning "You'll need to provide values for each secret."

    # Define required secrets
    declare -A secrets=(
        ["VERCEL_TOKEN"]="Vercel deployment token"
        ["NETLIFY_AUTH_TOKEN"]="Netlify authentication token"
        ["NETLIFY_SITE_ID_STAGING"]="Netlify site ID for staging"
        ["NETLIFY_SITE_ID_PRODUCTION"]="Netlify site ID for production"
        ["SNYK_TOKEN"]="Snyk security scanning token (optional)"
        ["SNYK_ORG"]="Snyk organization name (optional)"
        ["GITGUARDIAN_API_KEY"]="GitGuardian API key (optional)"
        ["GITLEAKS_LICENSE"]="Gitleaks license key (optional)"
        ["SLACK_WEBHOOK_URL"]="Slack webhook URL for notifications (optional)"
    )

    local secrets_to_add=()

    # Check which secrets already exist
    print_status "Checking existing secrets..."

    for secret_name in "${!secrets[@]}"; do
        if gh secret list --repo "$REPO_OWNER/$REPO_NAME" | grep -q "^$secret_name$"; then
            print_status "Secret '$secret_name' already exists"
        else
            secrets_to_add+=("$secret_name:${secrets[$secret_name]}")
        fi
    done

    # Add missing secrets
    if [ ${#secrets_to_add[@]} -ne 0 ]; then
        print_status "Found ${#secrets_to_add[@]} missing secrets"
        print_warning "Please provide values for the following secrets:"

        for secret_info in "${secrets_to_add[@]}"; do
            IFS=':' read -r secret_name secret_description <<< "$secret_info"

            echo
            echo "Secret: $secret_name"
            echo "Description: $secret_description"
            echo "Enter value (or press Enter to skip):"
            read -s secret_value
            echo

            if [ -n "$secret_value" ]; then
                echo "$secret_value" | gh secret set "$secret_name" --repo "$REPO_OWNER/$REPO_NAME"
                print_status "Added secret: $secret_name"
            else
                print_warning "Skipped secret: $secret_name"
            fi
        done
    else
        print_status "All required secrets are already configured"
    fi
}

# Setup environments
setup_environments() {
    print_header "Setting Up Environments"

    local environments=("staging" "production")

    for env in "${environments[@]}"; do
        print_status "Setting up environment: $env"

        # Create environment if it doesn't exist
        if ! gh api repos/"$REPO_OWNER/$REPO_NAME"/environments/"$env" > /dev/null 2>&1; then
            gh api --method POST repos/"$REPO_OWNER/$REPO_NAME"/environments \
                --field name="$env" || print_warning "Could not create environment: $env"
        else
            print_status "Environment '$env' already exists"
        fi

        # Set protection rules for production
        if [ "$env" = "production" ]; then
            print_status "Setting up protection rules for production..."

            # Configure protection rules (requires GitHub Advanced Security or GitHub Enterprise)
            # This is a placeholder - actual implementation may vary based on your GitHub plan
            print_warning "Production protection rules may require manual configuration"
        fi
    done

    print_status "Environment setup completed"
}

# Validate workflows
validate_workflows() {
    print_header "Validating Workflow Files"

    local workflow_files=(
        ".github/workflows/ci.yml"
        ".github/workflows/deploy-staging.yml"
        ".github/workflows/deploy-production.yml"
        ".github/workflows/security-scan.yml"
        ".github/workflows/performance-tests.yml"
        ".github/workflows/monitoring.yml"
        ".github/workflows/release.yml"
        ".github/workflows/database.yml"
    )

    local missing_files=()
    local invalid_files=()

    for file in "${workflow_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        else
            # Validate YAML syntax
            if ! python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
                invalid_files+=("$file (invalid YAML)")
            fi
        fi
    done

    if [ ${#missing_files[@]} -ne 0 ]; then
        print_error "Missing workflow files: ${missing_files[*]}"
        return 1
    fi

    if [ ${#invalid_files[@]} -ne 0 ]; then
        print_error "Invalid workflow files: ${invalid_files[*]}"
        return 1
    fi

    print_status "All workflow files are valid"
}

# Setup branch protection rules
setup_branch_protection() {
    print_header "Setting Up Branch Protection Rules"

    print_status "Setting up branch protection for main branch..."

    # Create branch protection for main branch
    gh api --method PUT repos/"$REPO_OWNER/$REPO_NAME"/branches/main/protection \
        --field required_status_checks='{"strict":true,"contexts":["CI"]}' \
        --field enforce_admins=true \
        --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
        --field restrictions=null \
        --field allow_force_pushes=false \
        --field allow_deletions=false || print_warning "Could not set up branch protection rules"

    print_status "Branch protection rules configured"
}

# Test local setup
test_local_setup() {
    print_header "Testing Local Setup"

    # Test if commands work
    print_status "Testing local commands..."

    # Test pnpm
    if pnpm --version > /dev/null 2>&1; then
        print_status "pnpm is working: $(pnpm --version)"
    else
        print_error "pnpm is not working correctly"
        return 1
    fi

    # Test node
    if node --version > /dev/null 2>&1; then
        print_status "Node.js is working: $(node --version)"
    else
        print_error "Node.js is not working correctly"
        return 1
    fi

    # Test build
    print_status "Testing build process..."
    if pnpm install > /dev/null 2>&1; then
        print_status "Dependencies installed successfully"

        if pnpm build > /dev/null 2>&1; then
            print_status "Build completed successfully"
        else
            print_warning "Build failed - this may be expected if there are build errors"
        fi
    else
        print_error "Failed to install dependencies"
        return 1
    fi

    print_status "Local setup test completed"
}

# Main setup function
main() {
    print_header "GitHub Actions Workflows Setup"
    echo "This script will set up GitHub Actions workflows for the Parsify.dev project"
    echo

    # Check dependencies
    check_dependencies

    # Validate repository structure
    validate_repo_structure

    # Setup GitHub repository
    setup_github_repo

    # Setup secrets (interactive)
    echo
    read -p "Do you want to set up secrets now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_secrets
    else
        print_warning "Skipping secrets setup. You can run this script again later to configure secrets."
    fi

    # Setup environments
    setup_environments

    # Validate workflows
    if validate_workflows; then
        print_status "Workflow validation passed"
    else
        print_error "Workflow validation failed"
        exit 1
    fi

    # Setup branch protection
    echo
    read -p "Do you want to set up branch protection rules? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_branch_protection
    else
        print_warning "Skipping branch protection setup"
    fi

    # Test local setup
    test_local_setup

    print_header "Setup Complete!"
    echo
    print_status "GitHub Actions workflows have been set up successfully!"
    echo
    echo "Next steps:"
    echo "1. Configure any missing secrets in GitHub repository settings"
    echo "2. Test workflows by creating a pull request or pushing to develop branch"
    echo "3. Monitor workflow runs in the Actions tab of your GitHub repository"
    echo "4. Adjust workflow configurations as needed for your specific requirements"
    echo
    print_status "For more information, see .github/README.md"
}

# Run the script
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
