#!/usr/bin/env node

/**
 * Production Validation Script
 * Validates that the application is ready for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Production Validation...\n');

const validations = [
  {
    name: 'Package Dependencies',
    check: () => {
      try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

        // Check critical security packages are updated
        const securityChecks = [
          {
            package: 'jsonpath-plus',
            minVersion: '10.3.0',
            current: packageJson.dependencies?.['jsonpath-plus']
          },
          {
            package: 'crypto-js',
            minVersion: '4.2.0',
            current: packageJson.dependencies?.['crypto-js']
          }
        ];

        for (const check of securityChecks) {
          if (!check.current || check.current < check.minVersion) {
            throw new Error(`${check.package} version ${check.current} is below minimum ${check.minVersion}`);
          }
        }

        console.log('✅ Package Dependencies: All critical packages updated');
        return true;
      } catch (error) {
        console.log(`❌ Package Dependencies: ${error.message}`);
        return false;
      }
    }
  },
  {
    name: 'Security Audit',
    check: () => {
      try {
        const auditResult = execSync('pnpm audit --audit-level moderate --json', {
          encoding: 'utf8',
          stdio: 'pipe'
        });

        const audit = JSON.parse(auditResult);
        const vulnerabilities = audit.vulnerabilities || {};

        const criticalCount = Object.values(vulnerabilities).filter(v => v.severity === 'critical').length;
        const highCount = Object.values(vulnerabilities).filter(v => v.severity === 'high').length;

        if (criticalCount > 0 || highCount > 0) {
          throw new Error(`Found ${criticalCount} critical and ${highCount} high vulnerabilities`);
        }

        console.log('✅ Security Audit: No critical or high vulnerabilities found');
        return true;
      } catch (error) {
        if (error.message.includes('No critical or high vulnerabilities')) {
          console.log('✅ Security Audit: No critical or high vulnerabilities found');
          return true;
        }
        console.log(`❌ Security Audit: ${error.message}`);
        return false;
      }
    }
  },
  {
    name: 'TypeScript Compilation',
    check: () => {
      try {
        execSync('pnpm type-check', { stdio: 'pipe' });
        console.log('✅ TypeScript Compilation: Type checking passed');
        return true;
      } catch (error) {
        console.log('❌ TypeScript Compilation: Type errors found (see output above)');
        return false;
      }
    }
  },
  {
    name: 'Build Process',
    check: () => {
      try {
        console.log('📦 Running production build...');
        execSync('pnpm build:prod', { stdio: 'inherit' });
        console.log('✅ Build Process: Production build successful');
        return true;
      } catch (error) {
        console.log('❌ Build Process: Production build failed');
        return false;
      }
    }
  },
  {
    name: 'Bundle Size Check',
    check: () => {
      try {
        const buildDir = '.next';
        const staticDir = path.join(buildDir, 'static');

        if (!fs.existsSync(staticDir)) {
          console.log('⚠️ Bundle Size Check: Build directory not found, run build first');
          return false;
        }

        // Calculate total bundle size
        const calculateSize = (dir) => {
          let totalSize = 0;
          const files = fs.readdirSync(dir);

          for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
              totalSize += calculateSize(filePath);
            } else {
              totalSize += stats.size;
            }
          }

          return totalSize;
        };

        const totalSize = calculateSize(staticDir);
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

        console.log(`✅ Bundle Size Check: Total bundle size is ${sizeInMB} MB`);
        return true;
      } catch (error) {
        console.log(`❌ Bundle Size Check: ${error.message}`);
        return false;
      }
    }
  },
  {
    name: 'Configuration Files',
    check: () => {
      try {
        const requiredFiles = [
          'package.json',
          '.npmrc',
          'next.config.js',
          'tsconfig.json',
          'tailwind.config.ts'
        ];

        const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

        if (missingFiles.length > 0) {
          throw new Error(`Missing configuration files: ${missingFiles.join(', ')}`);
        }

        console.log('✅ Configuration Files: All required files present');
        return true;
      } catch (error) {
        console.log(`❌ Configuration Files: ${error.message}`);
        return false;
      }
    }
  }
];

// Run all validations
let passed = 0;
let failed = 0;

for (const validation of validations) {
  const success = validation.check();
  if (success) {
    passed++;
  } else {
    failed++;
  }
  console.log(''); // Add spacing
}

// Final result
console.log('📊 Production Validation Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 All validations passed! Application is ready for production deployment.');
  process.exit(0);
} else {
  console.log('\n⚠️ Some validations failed. Please address the issues before deploying to production.');
  process.exit(1);
}
