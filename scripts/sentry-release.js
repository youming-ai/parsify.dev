#!/usr/bin/env node

/**
 * Sentry Release Tracking and Source Map Upload Script
 *
 * This script automates the process of creating releases in Sentry
 * and uploading source maps for better error tracking and debugging.
 */

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const _path = require('node:path')

// Configuration
const _SENTRY_DSN = process.env.SENTRY_DSN
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN
const SENTRY_ORG = process.env.SENTRY_ORG || 'your-org'
const SENTRY_PROJECT = process.env.SENTRY_PROJECT || 'parsify-api'

// Get version from package.json or git
function getVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
    return packageJson.version
  } catch (_error) {
    console.warn('Could not read version from package.json, using git commit')
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  }
}

// Get git commit SHA
function getCommitSha() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  } catch (_error) {
    console.warn('Could not get git commit SHA')
    return 'unknown'
  }
}

// Get git branch name
function getBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
    }).trim()
  } catch (_error) {
    console.warn('Could not get git branch name')
    return 'unknown'
  }
}

// Get build time
function getBuildTime() {
  return new Date().toISOString()
}

// Check if Sentry CLI is available
function checkSentryCli() {
  try {
    execSync('npx @sentry/cli --version', { stdio: 'pipe' })
    return true
  } catch (_error) {
    console.error('Sentry CLI not found. Installing...')
    execSync('npm install -g @sentry/cli', { stdio: 'inherit' })
    return true
  }
}

// Create a new release in Sentry
function createRelease(version, commitSha) {
  console.log(`Creating release ${version} in Sentry...`)

  try {
    const command = [
      'npx @sentry/cli releases',
      `--org=${SENTRY_ORG}`,
      `--project=${SENTRY_PROJECT}`,
      `new ${version}`,
      `--finalize`,
      `--log-level=info`,
    ].join(' ')

    if (commitSha && commitSha !== 'unknown') {
      execSync(`${command} --set-commits --auto`, { stdio: 'inherit' })
    } else {
      execSync(command, { stdio: 'inherit' })
    }

    console.log(`✅ Release ${version} created successfully`)
  } catch (error) {
    console.error('❌ Failed to create release:', error.message)
    throw error
  }
}

// Upload source maps to Sentry
function uploadSourceMaps(version, buildDir = './dist') {
  if (!fs.existsSync(buildDir)) {
    console.warn(`Build directory ${buildDir} does not exist. Skipping source map upload.`)
    return
  }

  console.log(`Uploading source maps from ${buildDir}...`)

  try {
    const command = [
      'npx @sentry/cli releases',
      `--org=${SENTRY_ORG}`,
      `--project=${SENTRY_PROJECT}`,
      `files ${version}`,
      `upload-sourcemaps ${buildDir}`,
      '--url-prefix ~/',
      '--validate',
      '--log-level=info',
    ].join(' ')

    execSync(command, { stdio: 'inherit' })
    console.log('✅ Source maps uploaded successfully')
  } catch (error) {
    console.error('❌ Failed to upload source maps:', error.message)
    throw error
  }
}

// Set deployment environment
function setDeployment(version, environment) {
  console.log(`Setting deployment environment to ${environment}...`)

  try {
    const command = [
      'npx @sentry-cli releases',
      `--org=${SENTRY_ORG}`,
      `--project=${SENTRY_PROJECT}`,
      `deploys ${version} new`,
      `--env=${environment}`,
      '--log-level=info',
    ].join(' ')

    execSync(command, { stdio: 'inherit' })
    console.log(`✅ Deployment environment set to ${environment}`)
  } catch (error) {
    console.error('❌ Failed to set deployment environment:', error.message)
    throw error
  }
}

// Generate release notes
function generateReleaseNotes(version, commitSha) {
  try {
    console.log('Generating release notes...')

    const previousTag = execSync('git describe --tags --abbrev=0 HEAD^', {
      encoding: 'utf8',
    }).trim()
    const commitMessages = execSync(`git log ${previousTag}..HEAD --oneline`, {
      encoding: 'utf8',
    })
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 10) // Limit to 10 commits

    const releaseNotes = {
      version,
      commitSha,
      buildTime: getBuildTime(),
      changes: commitMessages,
    }

    return releaseNotes
  } catch (error) {
    console.warn('Could not generate release notes:', error.message)
    return null
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'all'
  const environment = args[1] || process.env.NODE_ENV || 'development'

  console.log(`🚀 Sentry Release Management (${command})`)
  console.log(`Environment: ${environment}`)

  if (!SENTRY_AUTH_TOKEN) {
    console.error('❌ SENTRY_AUTH_TOKEN environment variable is required')
    process.exit(1)
  }

  if (!SENTRY_ORG || SENTRY_ORG === 'your-org') {
    console.error('❌ Please set SENTRY_ORG environment variable')
    process.exit(1)
  }

  if (!SENTRY_PROJECT || SENTRY_PROJECT === 'parsify-api') {
    console.error('❌ Please set SENTRY_PROJECT environment variable')
    process.exit(1)
  }

  try {
    const version = getVersion()
    const commitSha = getCommitSha()
    const branch = getBranch()
    const buildTime = getBuildTime()

    console.log(`Version: ${version}`)
    console.log(`Commit: ${commitSha}`)
    console.log(`Branch: ${branch}`)
    console.log(`Build Time: ${buildTime}`)

    // Check Sentry CLI availability
    checkSentryCli()

    switch (command) {
      case 'release':
        createRelease(version, commitSha)
        break

      case 'sourcemaps':
        uploadSourceMaps(version, args[2] || './dist')
        break

      case 'deploy':
        setDeployment(version, environment)
        break

      case 'all':
        createRelease(version, commitSha)
        uploadSourceMaps(version, args[2] || './dist')
        setDeployment(version, environment)
        break

      default:
        console.error(`Unknown command: ${command}`)
        console.log('Available commands: release, sourcemaps, deploy, all')
        process.exit(1)
    }

    // Generate and display release notes
    const releaseNotes = generateReleaseNotes(version, commitSha)
    if (releaseNotes) {
      console.log('\n📋 Release Notes:')
      console.log(`Version: ${releaseNotes.version}`)
      console.log(`Build Time: ${releaseNotes.buildTime}`)
      console.log('Changes:')
      releaseNotes.changes.forEach(commit => {
        console.log(`  - ${commit}`)
      })
    }

    console.log('\n✅ Sentry release management completed successfully!')
  } catch (error) {
    console.error('❌ Sentry release management failed:', error.message)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  getVersion,
  getCommitSha,
  getBranch,
  createRelease,
  uploadSourceMaps,
  setDeployment,
  generateReleaseNotes,
}
