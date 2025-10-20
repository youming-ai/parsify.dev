# GitHub Actions CI/CD Workflows

This repository contains comprehensive GitHub Actions workflows for automated testing, security scanning, deployment, and monitoring of the Parsify.dev application.

## 🚀 Workflow Overview

### Continuous Integration (`ci.yml`)
**Trigger**: Push to `main`/`develop`, Pull Requests, Daily schedule

**What it does**:
- ✅ Code linting with ESLint
- ✅ Code formatting check with Prettier
- ✅ TypeScript type checking
- ✅ Unit tests with coverage reporting
- ✅ Integration and E2E tests
- ✅ Multi-app building (web, API)
- ✅ Security audit and CodeQL analysis
- ✅ Dependency vulnerability scanning
- ✅ Build artifact generation

### Staging Deployment (`deploy-staging.yml`)
**Trigger**: Push to `develop`, Manual dispatch

**What it does**:
- 🔍 Change detection to only deploy affected apps
- 🏗️ Production-ready builds for staging
- 🚀 Automated deployment to staging environment
- 🏥 Health checks and smoke testing
- 📊 Performance smoke tests
- 🔄 Database migrations
- 📢 Slack/Discord notifications

### Production Deployment (`deploy-production.yml`)
**Trigger**: Version tags, Staging promotion, Manual dispatch

**What it does**:
- 🔒 Pre-deployment security validation
- 🏗️ Optimized production builds
- 🚀 Multi-stage deployment with approval
- 🔄 Database backup and migrations
- 🏥 Comprehensive health checks
- 📊 Critical path testing
- 🚨 Automatic rollback on failure
- 📢 Release notifications and GitHub releases

### Security Scanning (`security-scan.yml`)
**Trigger**: Push to `main`/`develop`, Pull Requests, Daily schedule

**What it does**:
- 🔍 Dependency vulnerability scanning (pnpm audit, Snyk)
- 🔍 Code security analysis (CodeQL, Semgrep, ESLint security)
- 🔍 Secrets detection (TruffleHog, Gitleaks, GitGuardian)
- 🔍 Container security scanning (Trivy)
- 📊 Comprehensive security reporting
- 🚨 Automatic issue creation for critical findings

### Performance Testing (`performance-tests.yml`)
**Trigger**: Push to `main`/`develop`, Pull Requests, Daily schedule

**What it does**:
- 🏃 Multi-scenario performance tests (smoke, load, stress)
- 📈 Load testing with concurrent users
- 📊 Performance regression detection
- 📈 Response time and throughput analysis
- 📊 Performance trend reporting
- 🚨 Alerting on performance regressions

### Monitoring (`monitoring.yml`)
**Trigger**: Push to `main`/`develop`, 6-hourly schedule

**What it does**:
- 🟢 Real-time uptime monitoring
- 🚀 Application performance tracking (Lighthouse)
- 📊 API performance testing
- 🚨 Error rate monitoring
- 📈 Analytics and user experience metrics
- 📊 Comprehensive monitoring dashboard

### Release Management (`release.yml`)
**Trigger**: Version tags, Manual dispatch

**What it does**:
- 🏷️ Automated version management
- 📝 Changelog generation
- 🏗️ Release builds and packaging
- 🚀 GitHub release creation with assets
- 🚀 Production deployment (optional)
- 📢 Release notifications
- 🔄 Release rollback on failure

### Database Operations (`database.yml`)
**Trigger**: Migration changes, Manual dispatch, Schedule

**What it does**:
- ✅ Migration file validation
- 🧪 Migration testing on test database
- 🚀 Automated migration deployment
- 💾 Database backup and restore
- 📊 Database analytics and optimization
- 🔄 Migration rollback capabilities

## 🔧 Setup and Configuration

### Required Secrets

Configure these secrets in your GitHub repository settings:

#### Basic Configuration
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
- `NODE_VERSION`: Set to `18` (can be overridden in workflows)

#### Deployment Secrets
```
# Staging Environment
STAGING_DEPLOY_HOST: staging-server.example.com
STAGING_DEPLOY_USER: deploy
STAGING_DEPLOY_KEY: SSH private key for staging
STAGING_DATABASE_URL: Database connection string for staging

# Production Environment
PRODUCTION_DEPLOY_HOST: production-server.example.com
PRODUCTION_DEPLOY_USER: deploy
PRODUCTION_DEPLOY_KEY: SSH private key for production
PRODUCTION_DATABASE_URL: Database connection string for production
```

#### Third-party Services
```
# Vercel Deployment (optional)
VERCEL_TOKEN: Your Vercel API token
VERCEL_ORG_ID: Your Vercel organization ID
VERCEL_PROJECT_ID: Your Vercel project ID

# Cloudflare Workers (optional)
CLOUDFLARE_API_TOKEN: Your Cloudflare API token
CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID

# AWS Services (optional)
AWS_ACCESS_KEY_ID: AWS access key
AWS_SECRET_ACCESS_KEY: AWS secret key
AWS_REGION: AWS region (e.g., us-west-2)

# Security Scanning
SNYK_TOKEN: Your Snyk API token (optional)
SNYK_ORG: Your Snyk organization ID
GITLEAKS_LICENSE: Gitleaks license key (optional)
GITGUARDIAN_API_KEY: GitGuardian API key (optional)

# Monitoring and Notifications
SLACK_WEBHOOK_URL: Slack webhook for notifications
SENTRY_DSN: Sentry DSN for error tracking
```

### Environment Variables

The workflows use these environment variables (configured in each workflow):

- `NODE_VERSION`: Node.js version (default: `18`)
- `PNPM_VERSION`: pnpm version (default: `8`)
- `ENVIRONMENT`: Target environment (`staging`, `production`)

### Repository Structure

```
.github/
├── workflows/
│   ├── ci.yml                    # Continuous Integration
│   ├── deploy-staging.yml       # Staging Deployment
│   ├── deploy-production.yml    # Production Deployment
│   ├── security-scan.yml        # Security Scanning
│   ├── performance-tests.yml    # Performance Testing
│   ├── monitoring.yml           # Application Monitoring
│   ├── release.yml              # Release Management
│   └── database.yml             # Database Operations
├── codeql/
│   └── codeql-config.yml        # CodeQL Configuration
└── README.md                    # This file
```

## 🚀 Usage Guide

### Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   # Create Pull Request to develop
   ```

2. **Staging Deployment**
   ```bash
   git checkout develop
   git merge feature/new-feature
   git push origin develop
   # Automatically deploys to staging
   ```

3. **Production Release**
   ```bash
   # Option 1: Tag-based release
   git tag v1.0.0
   git push origin v1.0.0
   
   # Option 2: Manual release
   # Go to Actions > Release Management > Run workflow
   ```

### Manual Deployment

You can manually trigger workflows from the GitHub Actions tab:

1. Go to **Actions** → Select workflow
2. Click **Run workflow**
3. Choose parameters and confirm

### Database Operations

Run database operations manually:

1. Go to **Actions** → Database Operations
2. Click **Run workflow**
3. Choose operation type:
   - `migrate`: Run database migrations
   - `backup`: Create database backup
   - `seed`: Seed database with test data
   - `analyze`: Run database analytics
4. Select target environment
5. Confirm run

## 🔒 Security Best Practices

### Access Control

- Use environment protection rules for production deployments
- Require approval for production deployments
- Limit access to sensitive secrets
- Use least-privilege access for deployment keys

### Security Scanning

- Security scans run on every push and PR
- Critical vulnerabilities block deployments
- All security findings are reported as GitHub issues
- Regular dependency updates are recommended

### Secrets Management

- Never commit secrets to the repository
- Use GitHub encrypted secrets
- Rotate secrets regularly
- Use different secrets for different environments

## 📊 Monitoring and Alerting

### Health Checks

- Automated uptime monitoring every 6 hours
- Health checks after every deployment
- Performance threshold monitoring
- Error rate tracking

### Alerts

- GitHub issues created for critical issues
- Slack notifications for deployments and failures
- Performance regression alerts
- Security vulnerability alerts

### Reports

- Comprehensive security reports
- Performance analysis reports
- Database analytics reports
- Deployment status summaries

## 🛠️ Customization

### Adding New Environments

1. Update workflow files to include new environment
2. Add environment-specific secrets
3. Configure deployment targets
4. Update monitoring and alerting

### Custom Deployment Targets

For custom deployment targets (Vercel, Netlify, etc.):

1. Add deployment secrets
2. Update deployment steps in workflows
3. Configure custom health checks
4. Update monitoring configuration

### Adding New Tests

1. Add tests to appropriate test suite
2. Update CI workflow if needed
3. Configure test reporting
4. Add test coverage thresholds

## 🚨 Troubleshooting

### Common Issues

**Deployment Fails**
- Check deployment secrets
- Verify target server accessibility
- Review deployment logs
- Check health check endpoints

**Security Scan Fails**
- Review security findings
- Update vulnerable dependencies
- Fix code security issues
- Check for leaked secrets

**Performance Tests Fail**
- Review performance regression
- Check application performance
- Optimize slow endpoints
- Verify test environment

**Database Migration Fails**
- Validate migration syntax
- Check database connectivity
- Review migration dependencies
- Verify migration rollback capability

### Getting Help

1. Check workflow logs for detailed error messages
2. Review GitHub issues for known problems
3. Check security and performance reports
4. Contact the development team for assistance

## 📈 Best Practices

### Development

- Write comprehensive tests for new features
- Follow code style guidelines
- Update documentation for API changes
- Test migrations on development environment

### Deployment

- Test deployments on staging first
- Use feature flags for risky changes
- Monitor deployments closely
- Have rollback plans ready

### Security

- Regularly update dependencies
- Review security scan reports
- Follow secure coding practices
- Use HTTPS and secure connections

### Performance

- Monitor application performance
- Optimize database queries
- Use caching appropriately
- Profile slow endpoints

## 🔄 Maintenance

### Regular Tasks

- Review and update dependencies monthly
- Check security scan reports weekly
- Monitor performance trends
- Update documentation as needed

### Workflow Updates

- Test workflow changes on staging
- Update workflow versions regularly
- Review and optimize performance
- Add new monitoring capabilities

---

**Note**: This documentation is a comprehensive guide to the GitHub Actions workflows. For specific implementation details or questions, refer to the individual workflow files or contact the development team.