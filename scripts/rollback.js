#!/usr/bin/env node

/**
 * Rollback and Recovery Script
 *
 * This script handles rollback operations for failed deployments,
 * data recovery, and disaster recovery procedures for the Parsify platform.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const readline = require('readline')

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..')
const BACKUPS_DIR = path.join(PROJECT_ROOT, 'backups')
const ROLLBACKS_DIR = path.join(PROJECT_ROOT, 'rollbacks')
const DEPLOYMENTS_DIR = path.join(PROJECT_ROOT, 'deployments')
const BUILD_DIR = path.join(PROJECT_ROOT, 'dist')

// Colors for console output
const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[34m',
  dim: '\x1b[2m',
  reset: '\x1b[0m'
}

function log(level, message) {
  console.log(`${colors[level]}[${level.toUpperCase()}]${colors.reset} ${message}`)
}

function exec(command, options = {}) {
  const { silent = false, cwd = PROJECT_ROOT } = options

  try {
    log('info', `Executing: ${command}`)
    const result = execSync(command, {
      cwd,
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8'
    })
    return result
  } catch (error) {
    log('error', `Command failed: ${command}`)
    log('error', error.message)
    if (!silent) {
      throw error
    }
    return null
  }
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

function ensureDirectories() {
  const dirs = [BACKUPS_DIR, ROLLBACKS_DIR, DEPLOYMENTS_DIR]

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      log('info', `Created directory: ${dir}`)
    }
  }
}

function getDeploymentHistory() {
  const deploymentsFile = path.join(DEPLOYMENTS_DIR, 'history.json')

  if (!fs.existsSync(deploymentsFile)) {
    return []
  }

  try {
    const content = fs.readFileSync(deploymentsFile, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    log('error', 'Failed to read deployment history')
    return []
  }
}

function saveDeploymentRecord(deployment) {
  ensureDirectories()

  const deploymentsFile = path.join(DEPLOYMENTS_DIR, 'history.json')
  const history = getDeploymentHistory()

  // Add new deployment to history
  history.unshift({
    ...deployment,
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID()
  })

  // Keep only last 50 deployments
  if (history.length > 50) {
    history.splice(50)
  }

  fs.writeFileSync(deploymentsFile, JSON.stringify(history, null, 2))
  log('success', 'Deployment record saved')

  return deployment
}

function listDeployments() {
  const history = getDeploymentHistory()

  if (history.length === 0) {
    log('info', 'No deployment history found')
    return []
  }

  console.log('\n=== Deployment History ===')
  console.log('ID\tEnvironment\tStatus\tTimestamp\t\t\tURL')
  console.log('---\t---------\t------\t--------\t\t---')

  for (let i = 0; i < history.length; i++) {
    const deployment = history[i]
    const timestamp = new Date(deployment.timestamp).toLocaleString()
    const url = deployment.api?.url || deployment.web?.url || 'N/A'

    console.log(`${i + 1}\t${deployment.environment}\t${deployment.status || 'unknown'}\t${timestamp}\t${url}`)
  }

  return history
}

function createPreDeploymentBackup(env) {
  log('info', `Creating pre-deployment backup for ${env}...`)

  ensureDirectories()

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupId = `pre-deploy-${env}-${timestamp}`
  const backupDir = path.join(BACKUPS_DIR, backupId)

  fs.mkdirSync(backupDir, { recursive: true })

  // Backup current build
  if (fs.existsSync(BUILD_DIR)) {
    const buildBackup = path.join(backupDir, 'build')
    fs.cpSync(BUILD_DIR, buildBackup, { recursive: true })
    log('success', 'Build backed up')
  }

  // Backup database
  const dbBackupScript = path.join(__dirname, 'database.js')
  try {
    exec(`node ${dbBackupScript} backup ${env} ${backupId}-database`)
    log('success', 'Database backed up')
  } catch (error) {
    log('warning', 'Database backup failed')
  }

  // Backup environment files
  const envDir = path.join(PROJECT_ROOT, '.env')
  if (fs.existsSync(envDir)) {
    const envBackup = path.join(backupDir, 'env')
    fs.cpSync(envDir, envBackup, { recursive: true })
    log('success', 'Environment files backed up')
  }

  // Create backup metadata
  const metadata = {
    id: backupId,
    type: 'pre-deployment',
    environment: env,
    timestamp: new Date().toISOString(),
    gitCommit: getCurrentGitCommit(),
    gitBranch: getCurrentGitBranch(),
    components: {
      build: fs.existsSync(path.join(backupDir, 'build')),
      database: fs.existsSync(path.join(BACKUPS_DIR, `${backupId}-database.sql`)),
      env: fs.existsSync(path.join(backupDir, 'env'))
    }
  }

  fs.writeFileSync(path.join(backupDir, 'metadata.json'), JSON.stringify(metadata, null, 2))

  log('success', `Pre-deployment backup created: ${backupId}`)
  return backupId
}

function getCurrentGitCommit() {
  try {
    return exec('git rev-parse --short HEAD', { silent: true }).trim()
  } catch (error) {
    return 'unknown'
  }
}

function getCurrentGitBranch() {
  try {
    return exec('git rev-parse --abbrev-ref HEAD', { silent: true }).trim()
  } catch (error) {
    return 'unknown'
  }
}

async function rollbackDeployment(env, targetDeployment = null) {
  log('warning', `Starting rollback for ${env} environment`)

  const rl = createInterface()

  try {
    // Get deployment history
    const history = getDeploymentHistory()
    const successfulDeployments = history.filter(d =>
      d.environment === env && d.status === 'success'
    )

    if (successfulDeployments.length === 0) {
      log('error', 'No successful deployments found for rollback')
      return false
    }

    let deploymentToRollback = targetDeployment

    // If no specific deployment, prompt user to select one
    if (!deploymentToRollback) {
      console.log('\n=== Available deployments for rollback ===')
      for (let i = 0; i < successfulDeployments.length && i < 10; i++) {
        const deployment = successfulDeployments[i]
        const timestamp = new Date(deployment.timestamp).toLocaleString()
        console.log(`${i + 1}. ${timestamp} - ${deployment.api?.url || deployment.web?.url}`)
      }

      const selection = await askQuestion(
        rl,
        'Select deployment to rollback (1-10) or press Enter for most recent: '
      )

      const index = selection ? parseInt(selection) - 1 : 0
      if (index >= 0 && index < successfulDeployments.length) {
        deploymentToRollback = successfulDeployments[index]
      } else {
        log('error', 'Invalid selection')
        return false
      }
    }

    // Confirm rollback
    const confirm = await askQuestion(
      rl,
      `Are you sure you want to rollback to deployment from ${new Date(deploymentToRollback.timestamp).toLocaleString()}? (yes/no): `
    )

    if (confirm.toLowerCase() !== 'yes') {
      log('info', 'Rollback cancelled')
      return false
    }

    // Create backup before rollback
    log('info', 'Creating pre-rollback backup...')
    const backupId = createPreDeploymentBackup(env)

    // Perform rollback
    log('info', 'Performing rollback...')

    // Rollback API if available
    if (deploymentToRollback.api) {
      log('info', 'Rolling back API deployment...')

      // Restore from backup if available
      const backupBuild = path.join(BACKUPS_DIR, backupId, 'build', 'api')
      if (fs.existsSync(backupBuild)) {
        fs.cpSync(backupBuild, path.join(BUILD_DIR, 'api'), { recursive: true })
        log('success', 'API build restored from backup')
      }

      // Redeploy API
      const deployScript = path.join(__dirname, 'deploy.js')
      exec(`node ${deployScript} api ${env}`)
      log('success', 'API rollback completed')
    }

    // Rollback database if needed
    if (deploymentToRollback.database) {
      log('info', 'Rolling back database...')

      const dbScript = path.join(__dirname, 'database.js')
      exec(`node ${dbScript} restore ${env} ${deploymentToRollback.database}`)
      log('success', 'Database rollback completed')
    }

    // Record rollback
    const rollbackRecord = {
      type: 'rollback',
      environment: env,
      from: deploymentToRollback,
      backupId,
      status: 'success',
      timestamp: new Date().toISOString()
    }

    saveDeploymentRecord(rollbackRecord)

    log('success', 'Rollback completed successfully')
    log('info', `Backup created before rollback: ${backupId}`)

    return true

  } catch (error) {
    log('error', `Rollback failed: ${error.message}`)

    // Record failed rollback
    const rollbackRecord = {
      type: 'rollback',
      environment: env,
      from: targetDeployment,
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }

    saveDeploymentRecord(rollbackRecord)

    return false
  } finally {
    rl.close()
  }
}

function restoreFromBackup(backupId, env) {
  log('info', `Restoring from backup: ${backupId}`)

  const backupDir = path.join(BACKUPS_DIR, backupId)

  if (!fs.existsSync(backupDir)) {
    log('error', `Backup not found: ${backupId}`)
    return false
  }

  // Read backup metadata
  const metadataPath = path.join(backupDir, 'metadata.json')
  if (!fs.existsSync(metadataPath)) {
    log('error', 'Backup metadata not found')
    return false
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
  log('info', `Backup type: ${metadata.type}`)
  log('info', `Backup environment: ${metadata.environment}`)
  log('info', `Backup timestamp: ${metadata.timestamp}`)

  try {
    // Restore build
    if (metadata.components.build) {
      const buildBackup = path.join(backupDir, 'build')
      if (fs.existsSync(buildBackup)) {
        fs.cpSync(buildBackup, BUILD_DIR, { recursive: true })
        log('success', 'Build restored from backup')
      }
    }

    // Restore database
    if (metadata.components.database) {
      const dbBackupFile = path.join(BACKUPS_DIR, `${backupId}-database.sql`)
      if (fs.existsSync(dbBackupFile)) {
        const dbScript = path.join(__dirname, 'database.js')
        exec(`node ${dbScript} restore ${env} ${path.basename(dbBackupFile)}`)
        log('success', 'Database restored from backup')
      }
    }

    // Restore environment files
    if (metadata.components.env) {
      const envBackup = path.join(backupDir, 'env')
      const envDir = path.join(PROJECT_ROOT, '.env')
      if (fs.existsSync(envBackup) && fs.existsSync(envDir)) {
        fs.cpSync(envBackup, envDir, { recursive: true })
        log('success', 'Environment files restored from backup')
      }
    }

    log('success', 'Backup restoration completed')
    return true

  } catch (error) {
    log('error', `Backup restoration failed: ${error.message}`)
    return false
  }
}

function listBackups() {
  ensureDirectories()

  if (!fs.existsSync(BACKUPS_DIR)) {
    log('info', 'No backups found')
    return []
  }

  const backups = fs.readdirSync(BACKUPS_DIR)
    .filter(name => fs.statSync(path.join(BACKUPS_DIR, name)).isDirectory())
    .map(name => {
      const backupDir = path.join(BACKUPS_DIR, name)
      const metadataPath = path.join(backupDir, 'metadata.json')

      let metadata = null
      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
        } catch (error) {
          // Ignore metadata read errors
        }
      }

      return {
        id: name,
        metadata,
        size: getDirectorySize(backupDir)
      }
    })
    .sort((a, b) => {
      const aTime = a.metadata?.timestamp || ''
      const bTime = b.metadata?.timestamp || ''
      return bTime.localeCompare(aTime)
    })

  console.log('\n=== Available Backups ===')
  console.log('ID\t\t\tType\t\tEnvironment\tTimestamp\t\t\tSize')
  console.log('---\t\t\t----\t\t---------\t--------\t\t\t----')

  for (const backup of backups) {
    const metadata = backup.metadata || {}
    const timestamp = metadata.timestamp ? new Date(metadata.timestamp).toLocaleString() : 'Unknown'
    const size = `${(backup.size / 1024 / 1024).toFixed(2)} MB`

    console.log(`${backup.id.substring(0, 20)}...\t${metadata.type || 'unknown'}\t\t${metadata.environment || 'unknown'}\t${timestamp}\t${size}`)
  }

  return backups
}

function getDirectorySize(dirPath) {
  let totalSize = 0

  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath)

    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath)
      for (const file of files) {
        calculateSize(path.join(currentPath, file))
      }
    } else {
      totalSize += stats.size
    }
  }

  calculateSize(dirPath)
  return totalSize
}

function cleanupOldBackups(daysToKeep = 30) {
  log('info', `Cleaning up backups older than ${daysToKeep} days...`)

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const backups = listBackups()
  let deletedCount = 0
  let freedSpace = 0

  for (const backup of backups) {
    const backupDate = backup.metadata?.timestamp ? new Date(backup.metadata.timestamp) : null

    if (backupDate && backupDate < cutoffDate) {
      const backupDir = path.join(BACKUPS_DIR, backup.id)

      try {
        const size = getDirectorySize(backupDir)
        fs.rmSync(backupDir, { recursive: true, force: true })

        deletedCount++
        freedSpace += size

        log('info', `Deleted old backup: ${backup.id}`)
      } catch (error) {
        log('error', `Failed to delete backup ${backup.id}: ${error.message}`)
      }
    }
  }

  if (deletedCount > 0) {
    log('success', `Cleaned up ${deletedCount} old backups`)
    log('info', `Freed ${(freedSpace / 1024 / 1024).toFixed(2)} MB of space`)
  } else {
    log('info', 'No old backups to clean up')
  }
}

function createDisasterRecoveryPlan() {
  log('info', 'Creating disaster recovery plan...')

  const plan = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    description: 'Disaster Recovery Plan for Parsify Platform',

    scenarios: [
      {
        name: 'Complete System Failure',
        description: 'All services are down and inaccessible',
        priority: 'critical',
        recoverySteps: [
          '1. Assess the scope of the failure',
          '2. Check Cloudflare service status',
          '3. Verify DNS and domain configuration',
          '4. Restore from latest backup',
          '5. Redeploy all services',
          '6. Verify system functionality',
          '7. Monitor for issues'
        ],
        estimatedTime: '2-4 hours',
        contactPerson: 'DevOps Team'
      },
      {
        name: 'Database Corruption',
        description: 'Database is corrupted or inaccessible',
        priority: 'high',
        recoverySteps: [
          '1. Identify the cause of corruption',
          '2. Stop all application services',
          '3. Restore database from latest backup',
          '4. Run database consistency checks',
          '5. Restart application services',
          '6. Verify data integrity',
          '7. Monitor database performance'
        ],
        estimatedTime: '1-2 hours',
        contactPerson: 'Database Administrator'
      },
      {
        name: 'Deployment Failure',
        description: 'Recent deployment caused system issues',
        priority: 'medium',
        recoverySteps: [
          '1. Identify the failed deployment',
          '2. Rollback to previous working version',
          '3. Verify system functionality',
          '4. Investigate deployment issues',
          '5. Fix and retest deployment',
          '6. Redeploy with fixes'
        ],
        estimatedTime: '30-60 minutes',
        contactPerson: 'Development Team'
      }
    ],

    contacts: [
      {
        role: 'DevOps Team',
        contact: 'devops@parsify.dev',
        phone: '+1-555-DEVOPS'
      },
      {
        role: 'Database Administrator',
        contact: 'dba@parsify.dev',
        phone: '+1-555-DBA'
      },
      {
        role: 'Development Team',
        contact: 'dev@parsify.dev',
        phone: '+1-555-DEV'
      }
    ],

    resources: {
      backups: BACKUPS_DIR,
      scripts: path.join(__dirname),
      documentation: 'https://docs.parsify.dev/disaster-recovery'
    }
  }

  const planPath = path.join(ROLLBACKS_DIR, 'disaster-recovery-plan.json')
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2))

  log('success', `Disaster recovery plan created: ${planPath}`)
  return planPath
}

// Main CLI interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'help'
  const env = args[1] || 'development'

  switch (command) {
    case 'backup':
      createPreDeploymentBackup(env)
      break

    case 'rollback':
      const deploymentId = args[2]
      await rollbackDeployment(env, deploymentId)
      break

    case 'restore':
      const backupId = args[2]
      if (!backupId) {
        log('error', 'Backup ID is required')
        log('info', 'Usage: node rollback.js restore <backup_id> [environment]')
        process.exit(1)
      }
      restoreFromBackup(backupId, env)
      break

    case 'list':
      listDeployments()
      break

    case 'list-backups':
      listBackups()
      break

    case 'cleanup':
      const days = parseInt(args[2]) || 30
      cleanupOldBackups(days)
      break

    case 'disaster-plan':
      createDisasterRecoveryPlan()
      break

    case 'help':
      console.log(`
Rollback and Recovery Script

Usage: node rollback.js <command> [environment] [options]

Commands:
  backup [env]            Create pre-deployment backup
  rollback [env] [id]     Rollback to previous deployment
  restore <backup_id> [env] Restore from specific backup
  list                    List deployment history
  list-backups            List available backups
  cleanup [days]          Clean up old backups (default: 30 days)
  disaster-plan           Create disaster recovery plan
  help                    Show this help message

Examples:
  node rollback.js backup production
  node rollback.js rollback production
  node rollback.js restore backup-id-123 production
  node rollback.js list
  node rollback.js list-backups
  node rollback.js cleanup 7
  node rollback.js disaster-plan

Recovery Procedures:
  1. Always create a backup before making changes
  2. Test rollback procedures regularly
  3. Monitor system health after rollback
  4. Document all rollback actions
  5. Review and update disaster recovery plan

Backup Types:
  - pre-deployment: Created before each deployment
  - manual: Created manually by users
  - scheduled: Created automatically at regular intervals

Rollback Targets:
  - Full application rollback
  - Database-only rollback
  - Configuration-only rollback
`)
      break

    default:
      log('error', `Unknown command: ${command}`)
      log('info', 'Run "node rollback.js help" for usage information')
      process.exit(1)
  }
}

// Export functions for testing
module.exports = {
  createPreDeploymentBackup,
  rollbackDeployment,
  restoreFromBackup,
  listDeployments,
  listBackups,
  cleanupOldBackups,
  createDisasterRecoveryPlan,
  saveDeploymentRecord
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error)
}
