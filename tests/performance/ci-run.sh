#!/bin/bash

# Performance Test CI Script
# This script runs performance tests in CI environments

set -e  # Exit on any error

echo "🚀 Starting Performance Tests in CI"

# Configuration
API_URL="${API_URL:-http://localhost:8787}"
OUTPUT_DIR="${OUTPUT_DIR:-./performance-reports}"
SCENARIOS="${SCENARIOS:-smoke-test,tools-basic}"
FORMAT="${FORMAT:-json}"
MAX_P95="${MAX_P95:-200}"
MIN_SUCCESS_RATE="${MIN_SUCCESS_RATE:-0.95}"
MIN_RPS="${MIN_RPS:-10}"
CONCURRENCY="${CONCURRENCY:-10}"
REQUESTS="${REQUESTS:-50}"
FAIL_ON_THRESHOLD="${FAIL_ON_THRESHOLD:-true}"

echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Output Directory: $OUTPUT_DIR"
echo "  Scenarios: $SCENARIOS"
echo "  Max P95: ${MAX_P95}ms"
echo "  Min Success Rate: ${(MIN_SUCCESS_RATE * 100)}%"
echo "  Min RPS: $MIN_RPS"
echo "  Concurrency: $CONCURRENCY"
echo "  Requests per test: $REQUESTS"

# Wait for API to be ready (if it's starting up)
if [ "$WAIT_FOR_API" = "true" ]; then
    echo "⏳ Waiting for API to be ready..."
    timeout 60 bash -c 'until curl -f "$API_URL/health"; do sleep 2; done'
    echo "✅ API is ready"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Build the project if needed
if [ "$BUILD_PROJECT" = "true" ]; then
    echo "🔨 Building project..."
    npm run build
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Run performance tests
echo "🧪 Running performance tests..."

# Build the command
CMD="node tests/performance/runner.js \
    --url $API_URL \
    --output $OUTPUT_DIR \
    --format $FORMAT \
    --scenarios $SCENARIOS \
    --max-p95 $MAX_P95 \
    --min-success-rate $MIN_SUCCESS_RATE \
    --min-rps $MIN_RPS \
    --concurrency $CONCURRENCY \
    --requests $REQUESTS"

if [ "$FAIL_ON_THRESHOLD" = "true" ]; then
    CMD="$CMD --fail-on-threshold"
fi

if [ "$VERBOSE" = "true" ]; then
    CMD="$CMD --verbose"
fi

# Execute the command
echo "Running: $CMD"
eval $CMD

# Check if performance tests passed
if [ $? -eq 0 ]; then
    echo "✅ Performance tests completed successfully"

    # Generate summary for CI output
    echo "📊 Performance Test Summary:"

    # Find the most recent report
    LATEST_REPORT=$(find "$OUTPUT_DIR" -name "performance-report-*-summary.txt" -type f | sort | tail -1)
    if [ -n "$LATEST_REPORT" ]; then
        echo "Report location: $LATEST_REPORT"
        echo ""
        cat "$LATEST_REPORT"
    fi

    # Check if we should upload reports
    if [ "$UPLOAD_REPORTS" = "true" ]; then
        echo "📤 Uploading performance reports..."
        # Add your upload logic here (e.g., to S3, artifacts, etc.)
    fi

else
    echo "❌ Performance tests failed"
    exit 1
fi

echo "🎉 Performance test CI run completed"
