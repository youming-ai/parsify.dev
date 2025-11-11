#!/bin/bash

# Comprehensive test runner script for Parsify.dev tools homepage

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run tests with coverage
run_tests_with_coverage() {
    local test_pattern=${1:-""}
    local reporter=${2:-"verbose"}

    print_header "🧪 Running Tests with Coverage"
    print_status "Test pattern: ${test_pattern:-'all tests'}"
    print_status "Reporter: $reporter"

    # Ensure we have the test dependencies
    if ! command_exists pnpm; then
        print_error "pnpm is not installed. Please install pnpm first."
        exit 1
    fi

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        pnpm install
    fi

    # Run tests with coverage
    local cmd="pnpm vitest run --coverage"
    if [ -n "$test_pattern" ]; then
        cmd="$cmd $test_pattern"
    fi

    cmd="$cmd --reporter=$reporter"

    print_status "Running: $cmd"
    eval $cmd

    if [ $? -eq 0 ]; then
        print_success "All tests passed! ✅"

        # Show coverage summary
        if [ -f "coverage/lcov-report/index.html" ]; then
            print_status "Coverage report generated at: coverage/lcov-report/index.html"
        fi

        if [ -f "coverage/coverage-summary.json" ]; then
            print_status "Coverage summary available at: coverage/coverage-summary.json"
        fi

        return 0
    else
        print_error "Tests failed! ❌"
        return 1
    fi
}

# Function to run specific test suites
run_test_suite() {
    local suite=$1

    case $suite in
        "utils")
            print_header "🔧 Running Utility Tests"
            run_tests_with_coverage "src/__tests__/lib/*.test.ts"
            ;;
        "hooks")
            print_header "🪝 Running Hook Tests"
            run_tests_with_coverage "src/__tests__/hooks/*.test.tsx"
            ;;
        "components")
            print_header "🧩 Running Component Tests"
            run_tests_with_coverage "src/__tests__/components/**/*.test.tsx"
            ;;
        "pages")
            print_header "📄 Running Page Tests"
            run_tests_with_coverage "src/__tests__/app/**/*.test.tsx"
            ;;
        "homepage")
            print_header "🏠 Running Homepage Tests"
            run_tests_with_coverage "src/__tests__/app/tools/tools-page.test.tsx"
            ;;
        "search")
            print_header "🔍 Running Search Tests"
            run_tests_with_coverage "src/__tests__/components/tools/tool-search.test.tsx"
            ;;
        "filters")
            print_header "🎚️ Running Filter Tests"
            run_tests_with_coverage "src/__tests__/components/tools/tool-filters.test.tsx"
            ;;
        "navigation")
            print_header "🧭 Running Navigation Tests"
            run_tests_with_coverage "src/__tests__/components/tools/category-navigation.test.tsx"
            ;;
        "responsive")
            print_header "📱 Running Responsive Tests"
            run_tests_with_coverage "src/__tests__/hooks/use-responsive-layout.test.tsx"
            ;;
        "mobile")
            print_header "📱 Running Mobile Utility Tests"
            run_tests_with_coverage "src/__tests__/lib/mobile-utils.test.ts"
            ;;
        *)
            print_error "Unknown test suite: $suite"
            print_status "Available suites: utils, hooks, components, pages, homepage, search, filters, navigation, responsive, mobile"
            return 1
            ;;
    esac
}

# Function to run tests in watch mode
run_tests_watch() {
    local test_pattern=${1:-""}

    print_header "👀 Running Tests in Watch Mode"
    print_status "Test pattern: ${test_pattern:-'all tests'}"

    local cmd="pnpm vitest"
    if [ -n "$test_pattern" ]; then
        cmd="$cmd $test_pattern"
    fi

    print_status "Running: $cmd"
    eval $cmd
}

# Function to generate coverage report only
generate_coverage_report() {
    print_header "📊 Generating Coverage Report"

    # Run tests and generate coverage
    if run_tests_with_coverage "" "json"; then
        # Parse coverage results
        if [ -f "coverage/coverage-summary.json" ]; then
            print_header "📈 Coverage Summary"

            # Extract key metrics using jq (if available) or node
            if command_exists jq; then
                local total_lines=$(jq '.total.lines.pct' coverage/coverage-summary.json)
                local total_functions=$(jq '.total.functions.pct' coverage/coverage-summary.json)
                local total_branches=$(jq '.total.branches.pct' coverage/coverage-summary.json)
                local total_statements=$(jq '.total.statements.pct' coverage/coverage-summary.json)

                echo -e "${CYAN}Coverage Metrics:${NC}"
                echo -e "  Lines:        ${GREEN}${total_lines}%${NC}"
                echo -e "  Functions:    ${GREEN}${total_functions}%${NC}"
                echo -e "  Branches:     ${GREEN}${total_branches}%${NC}"
                echo -e "  Statements:   ${GREEN}${total_statements}%${NC}"
            else
                print_status "Install jq for better coverage formatting"
                print_status "Coverage report available at: coverage/coverage-summary.json"
            fi

            # Check if coverage meets thresholds
            local min_coverage=80
            if command_exists jq; then
                local coverage=$(jq '.total.statements.pct' coverage/coverage-summary.json)
                if (( $(echo "$coverage >= $min_coverage" | bc -l) )); then
                    print_success "Coverage meets minimum threshold of ${min_coverage}%"
                else
                    print_warning "Coverage below minimum threshold of ${min_coverage}%"
                fi
            fi
        fi

        # Open coverage report in browser if requested
        if command_exists open && [ -f "coverage/lcov-report/index.html" ]; then
            read -p "Open coverage report in browser? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                open coverage/lcov-report/index.html
            fi
        fi
    else
        print_error "Failed to generate coverage report"
        return 1
    fi
}

# Function to clean test artifacts
clean_test_artifacts() {
    print_header "🧹 Cleaning Test Artifacts"

    # Remove coverage directories
    if [ -d "coverage" ]; then
        rm -rf coverage
        print_status "Removed coverage directory"
    fi

    # Remove test results
    if [ -d "test-results" ]; then
        rm -rf test-results
        print_status "Removed test-results directory"
    fi

    # Remove vitest cache
    if [ -d "node_modules/.vite" ]; then
        rm -rf node_modules/.vite
        print_status "Cleaned vitest cache"
    fi

    print_success "Test artifacts cleaned"
}

# Function to check test setup
check_test_setup() {
    print_header "🔍 Checking Test Setup"

    # Check if vitest is installed
    if ! pnpm list vitest >/dev/null 2>&1; then
        print_error "vitest is not installed"
        print_status "Run: pnpm add -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom"
        return 1
    fi

    # Check if test files exist
    local test_files=$(find src/__tests__ -name "*.test.*" -o -name "*.spec.*" | wc -l)
    if [ "$test_files" -eq 0 ]; then
        print_warning "No test files found in src/__tests__"
    else
        print_success "Found $test_files test files"
    fi

    # Check vitest configuration
    if [ -f "vitest.config.ts" ]; then
        print_success "vitest.config.ts found"
    else
        print_warning "vitest.config.ts not found"
    fi

    # Check test setup
    if [ -f "src/__tests__/vitest.setup.ts" ]; then
        print_success "Test setup file found"
    else
        print_warning "Test setup file not found"
    fi

    print_success "Test setup check completed"
}

# Function to show help
show_help() {
    echo "Parsify.dev Test Runner"
    echo "======================"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  test [pattern]     Run all tests or specific pattern"
    echo "  coverage [pattern] Run tests with coverage"
    echo "  watch [pattern]    Run tests in watch mode"
    echo "  suite <name>       Run specific test suite"
    echo "  report             Generate coverage report"
    echo "  clean              Clean test artifacts"
    echo "  check              Check test setup"
    echo "  help               Show this help message"
    echo ""
    echo "Test Suites:"
    echo "  utils              Utility function tests"
    echo "  hooks              React hook tests"
    echo "  components         Component tests"
    echo "  pages              Page tests"
    echo "  homepage           Homepage specific tests"
    echo "  search             Search component tests"
    echo "  filters            Filter component tests"
    echo "  navigation         Navigation component tests"
    echo "  responsive         Responsive layout tests"
    echo "  mobile             Mobile utility tests"
    echo ""
    echo "Examples:"
    echo "  $0 test                           # Run all tests"
    echo "  $0 test \"search\"                  # Run search-related tests"
    echo "  $0 coverage                       # Run all tests with coverage"
    echo "  $0 suite homepage                 # Run homepage test suite"
    echo "  $0 watch                          # Run tests in watch mode"
    echo "  $0 report                         # Generate coverage report"
}

# Main script logic
main() {
    local command=${1:-"help"}

    # Ensure we're in the project root
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Check test setup before running tests
    case $command in
        "test"|"coverage"|"suite"|"watch")
            check_test_setup
            ;;
    esac

    case $command in
        "test")
            print_header "🚀 Running Tests"
            run_tests_with_coverage "${2:-}" "verbose"
            ;;
        "coverage")
            run_tests_with_coverage "${2:-}" "json"
            generate_coverage_report
            ;;
        "watch")
            run_tests_watch "${2:-}"
            ;;
        "suite")
            if [ -z "$2" ]; then
                print_error "Please specify a test suite"
                show_help
                exit 1
            fi
            run_test_suite "$2"
            ;;
        "report")
            generate_coverage_report
            ;;
        "clean")
            clean_test_artifacts
            ;;
        "check")
            check_test_setup
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
