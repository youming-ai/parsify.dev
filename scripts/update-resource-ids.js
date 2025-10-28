#!/usr/bin/env node

/**
 * Update Cloudflare Resource IDs in wrangler.toml
 * This script updates the wrangler.toml file with actual resource IDs
 */

const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

const CONFIG_PATH = path.join(__dirname, '../apps/api/wrangler.toml')

async function getResourceIds() {
  console.log('🔍 Fetching Cloudflare resource IDs...')

  try {
    // Get D1 database ID
    console.log('📊 Getting D1 database ID...')
    const d1Output = execSync('npx wrangler@latest d1 list --json', {
      encoding: 'utf8',
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN: 'b6DET2jFEDgLUQGm4WK9EDGJCwtIf1GuRcttsRsB',
      },
    })

    const databases = JSON.parse(d1Output)
    const database = databases.find(db => db.name === 'parsify-prod')
    const databaseId = database?.id || 'parsify-prod-db'

    console.log(`✅ D1 Database ID: ${databaseId}`)

    // Get KV namespace IDs
    console.log('💾 Getting KV namespace IDs...')
    const kvOutput = execSync('npx wrangler@latest kv namespace list --json', {
      encoding: 'utf8',
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN: 'b6DET2jFEDgLUQGm4WK9EDGJCwtIf1GuRcttsRsB',
      },
    })

    const namespaces = JSON.parse(kvOutput)

    const kvIds = {
      'parsify-prod-cache':
        namespaces.find(ns => ns.title === 'parsify-prod-cache')?.id || 'parsify-prod-cache',
      'parsify-prod-sessions':
        namespaces.find(ns => ns.title === 'parsify-prod-sessions')?.id || 'parsify-prod-sessions',
      'parsify-prod-uploads':
        namespaces.find(ns => ns.title === 'parsify-prod-uploads')?.id || 'parsify-prod-uploads',
      'parsify-prod-analytics':
        namespaces.find(ns => ns.title === 'parsify-prod-analytics')?.id ||
        'parsify-prod-analytics',
    }

    console.log('✅ KV Namespace IDs:', kvIds)

    return { databaseId, kvIds }
  } catch (_error) {
    console.log('⚠️  Could not fetch actual resource IDs, using defaults')
    return {
      databaseId: 'parsify-prod-db',
      kvIds: {
        'parsify-prod-cache': 'parsify-prod-cache',
        'parsify-prod-sessions': 'parsify-prod-sessions',
        'parsify-prod-uploads': 'parsify-prod-uploads',
        'parsify-prod-analytics': 'parsify-prod-analytics',
      },
    }
  }
}

function updateWranglerToml(databaseId, kvIds) {
  console.log('📝 Updating wrangler.toml...')

  try {
    let content = fs.readFileSync(CONFIG_PATH, 'utf8')

    // Update database ID
    content = content.replace(/database_id = ".*?"/, `database_id = "${databaseId}"`)

    // Update KV namespace IDs
    Object.entries(kvIds).forEach(([name, id]) => {
      const pattern = new RegExp(`id = "${name.replace(/[-]/g, '\\-')}"`)
      content = content.replace(pattern, `id = "${id}"`)
    })

    fs.writeFileSync(CONFIG_PATH, content)
    console.log('✅ wrangler.toml updated successfully')
  } catch (error) {
    console.error('❌ Failed to update wrangler.toml:', error.message)
    process.exit(1)
  }
}

async function main() {
  console.log('🚀 Starting resource ID update process...\n')

  const { databaseId, kvIds } = await getResourceIds()
  updateWranglerToml(databaseId, kvIds)

  console.log('\n🎉 Resource ID update completed!')
  console.log('📋 Summary:')
  console.log(`   D1 Database: ${databaseId}`)
  Object.entries(kvIds).forEach(([name, id]) => {
    console.log(`   KV ${name}: ${id}`)
  })

  console.log('\n🚀 You can now deploy with: npx wrangler deploy')
}

main().catch(console.error)
