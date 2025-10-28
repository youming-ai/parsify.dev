#!/bin/bash

# Cloudflare Deployment Script for Parsify.dev
# Usage: ./scripts/deploy-cloudflare.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLOUDFLARE_ACCOUNT_ID="adec54ff48f1c2618cf92f2279377392"
CLOUDFLARE_API_TOKEN="b6DET2jFEDgLUQGm4WK9EDGJCwtIf1GuRcttsRsB"
DOMAIN="parsify.dev"

echo -e "${BLUE}🚀 Starting Cloudflare deployment for Parsify.dev${NC}"
echo -e "${BLUE}Account ID: ${CLOUDFLARE_ACCOUNT_ID}${NC}"
echo -e "${BLUE}Domain: ${DOMAIN}${NC}"
echo ""

# Function to check if wrangler is available
check_wrangler() {
    if command -v wrangler &> /dev/null; then
        echo -e "${GREEN}✅ Wrangler CLI found${NC}"
    else
        echo -e "${YELLOW}⚠️  Wrangler CLI not found, using npx${NC}"
        WRANGLER_CMD="npx wrangler@latest"
    fi
}

# Function to create D1 database
create_d1_database() {
    echo -e "${BLUE}📊 Creating D1 Database...${NC}"

    # Check if database already exists
    if $WRANGLER_CMD d1 list | grep -q "parsify-prod"; then
        echo -e "${GREEN}✅ D1 database 'parsify-prod' already exists${NC}"
    else
        echo -e "${YELLOW}Creating new D1 database...${NC}"
        $WRANGLER_CMD d1 create parsify-prod
        echo -e "${GREEN}✅ D1 database created${NC}"
    fi
}

# Function to create KV namespaces
create_kv_namespaces() {
    echo -e "${BLUE}💾 Creating KV Namespaces...${NC}"

    NAMESPACES=("parsify-prod-cache" "parsify-prod-sessions" "parsify-prod-uploads" "parsify-prod-analytics")

    for namespace in "${NAMESPACES[@]}"; do
        if $WRANGLER_CMD kv namespace list | grep -q "$namespace"; then
            echo -e "${GREEN}✅ KV namespace '$namespace' already exists${NC}"
        else
            echo -e "${YELLOW}Creating KV namespace: $namespace${NC}"
            $WRANGLER_CMD kv namespace create "$namespace"
            echo -e "${GREEN}✅ KV namespace '$namespace' created${NC}"
        fi
    done
}

# Function to create R2 bucket
create_r2_bucket() {
    echo -e "${BLUE}📁 Creating R2 Bucket...${NC}"

    if $WRANGLER_CMD r2 bucket list | grep -q "parsify-prod-files"; then
        echo -e "${GREEN}✅ R2 bucket 'parsify-prod-files' already exists${NC}"
    else
        echo -e "${YELLOW}Creating R2 bucket...${NC}"
        $WRANGLER_CMD r2 bucket create parsify-prod-files
        echo -e "${GREEN}✅ R2 bucket created${NC}"
    fi
}

# Function to run database migrations
run_migrations() {
    echo -e "${BLUE}🗄️  Running database migrations...${NC}"

    # Update database ID in wrangler.toml
    DB_ID=$($WRANGLER_CMD d1 list --json | jq -r '.[] | select(.name=="parsify-prod") | .id' 2>/dev/null || echo "parsify-prod-db")

    # Update wrangler.toml with actual database ID
    sed -i.bak "s/database_id = \".*\"/database_id = \"$DB_ID\"/" apps/api/wrangler.toml

    echo -e "${YELLOW}Running migrations...${NC}"
    $WRANGLER_CMD d1 execute parsify-prod --file=./migrations/001_initial.sql --remote
    $WRANGLER_CMD d1 execute parsify-prod --file=./migrations/002_analytics.sql --remote
    $WRANGLER_CMD d1 execute parsify-prod --file=./migrations/seed.sql --remote

    echo -e "${GREEN}✅ Database migrations completed${NC}"
}

# Function to deploy API to Workers
deploy_api() {
    echo -e "${BLUE}🔧 Deploying API to Workers...${NC}"

    cd apps/api
    $WRANGLER_CMD deploy
    cd ../..

    echo -e "${GREEN}✅ API deployed to Workers${NC}"
}

# Function to deploy frontend to Pages
deploy_frontend() {
    echo -e "${BLUE}🎨 Deploying frontend to Pages...${NC}"

    # Build frontend
    cd apps/web
    npm run build

    # Deploy to Pages
    if $WRANGLER_CMD pages project list | grep -q "parsify-web"; then
        echo -e "${YELLOW}Deploying to existing Pages project...${NC}"
        $WRANGLER_CMD pages deploy .next --project-name parsify-web
    else
        echo -e "${YELLOW}Creating new Pages project...${NC}"
        $WRANGLER_CMD pages deploy .next --project-name parsify-web --compatibility-date=2024-09-23
    fi

    cd ../..

    echo -e "${GREEN}✅ Frontend deployed to Pages${NC}"
}

# Function to configure custom domain
configure_domain() {
    echo -e "${BLUE}🌐 Configuring custom domain...${NC}"

    # Configure Workers custom domain
    $WRANGLER_CMD custom-domains list api.parsify.dev 2>/dev/null || {
        echo -e "${YELLOW}Setting up Workers custom domain...${NC}"
        # Note: This step requires DNS configuration first
        echo -e "${YELLOW}Please configure DNS: CNAME api.parsify.dev -> parsify-api.${CLOUDFLARE_ACCOUNT_ID}.workers.dev${NC}"
    }

    echo -e "${GREEN}✅ Domain configuration notes provided${NC}"
}

# Function to run health checks
health_check() {
    echo -e "${BLUE}🏥 Running health checks...${NC}"

    # Check API health
    echo -e "${YELLOW}Checking API health...${NC}"
    if curl -s https://api.parsify.dev/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API health check passed${NC}"
    else
        echo -e "${RED}❌ API health check failed${NC}"
    fi

    # Check frontend
    echo -e "${YELLOW}Checking frontend...${NC}"
    if curl -s https://parsify.dev > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend health check passed${NC}"
    else
        echo -e "${RED}❌ Frontend health check failed${NC}"
    fi
}

# Main deployment flow
main() {
    # Set environment variables
    export CLOUDFLARE_ACCOUNT_ID
    export CLOUDFLARE_API_TOKEN

    # Check wrangler availability
    WRANGLER_CMD="wrangler"
    check_wrangler

    # Create resources
    create_d1_database
    create_kv_namespaces
    create_r2_bucket

    # Deploy services
    run_migrations
    deploy_api
    deploy_frontend

    # Configure domain
    configure_domain

    # Health checks
    health_check

    echo ""
    echo -e "${GREEN}🎉 Cloudflare deployment completed!${NC}"
    echo -e "${GREEN}📍 API: https://api.parsify.dev${NC}"
    echo -e "${GREEN}📍 Frontend: https://parsify.dev${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Important next steps:${NC}"
    echo -e "${YELLOW}1. Configure DNS records for custom domains${NC}"
    echo -e "${YELLOW}2. Update production environment variables${NC}"
    echo -e "${YELLOW}3. Test all endpoints and functionality${NC}"
    echo -e "${YELLOW}4. Set up monitoring and alerts${NC}"
}

# Run main function
main "$@"
