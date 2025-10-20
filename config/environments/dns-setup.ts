/**
 * DNS Configuration Management
 *
 * This module provides utilities for managing DNS configurations across
 * different environments (development, staging, production).
 */

import dnsConfig from './dns-config.json'

export interface DNSRecord {
  type: string
  name: string
  content: string
  ttl: number
  proxied?: boolean
  priority?: number
  service?: string
  proto?: string
  port?: number
  weight?: number
  tag?: string
  flags?: string
  certificate?: string
  key_tag?: number
  algorithm?: number
  digest_type?: number
  digest?: string
  failover?: {
    enabled: boolean
    backupContent: string
  }
  header?: {
    Host: string[]
  }
}

export interface DNSZone {
  domain: string
  subdomains: Record<string, string>
  records: DNSRecord[]
  cloudflare: {
    enabled: boolean
    zoneId: string | null
    proxyEnabled: boolean
    sslMode: string
    alwaysUseHttps: boolean
    http2: boolean
    http3: boolean
    caching: Record<string, any>
    security: Record<string, any>
    performance: Record<string, any>
    loadBalancing?: Record<string, any>
    ddosProtection?: Record<string, any>
  }
}

export interface DNSConfiguration {
  development: DNSZone
  staging: DNSZone
  production: DNSZone
  shared: {
    dnsRecords: DNSRecord[]
    email: {
      mxRecords: Array<{
        preference: number
        exchange: string
        ttl: number
      }>
      dkim: {
        selector: string
        domain: string
        value: string
      }
      spf: string
      dmarc: string
    }
    analytics: Record<string, any>
  }
}

/**
 * Get DNS configuration for a specific environment
 */
export function getDNSConfig(environment: 'development' | 'staging' | 'production'): DNSZone {
  const config = dnsConfig as DNSConfiguration

  if (!config[environment]) {
    throw new Error(`DNS configuration not found for environment: ${environment}`)
  }

  // Replace environment variables in configuration
  const zoneConfig = config[environment]
  const replacedConfig = replaceEnvironmentVariables(zoneConfig)

  return replacedConfig
}

/**
 * Get all DNS records for an environment
 */
export function getDNSRecords(environment: 'development' | 'staging' | 'production'): DNSRecord[] {
  const zoneConfig = getDNSConfig(environment)
  const sharedConfig = (dnsConfig as DNSConfiguration).shared

  // Combine environment-specific records with shared records
  const allRecords = [
    ...zoneConfig.records,
    ...sharedConfig.dnsRecords
  ]

  // Add MX records for email
  if (sharedConfig.email?.mxRecords) {
    sharedConfig.email.mxRecords.forEach(mx => {
      allRecords.push({
        type: 'MX',
        name: zoneConfig.domain,
        content: mx.exchange,
        ttl: mx.ttl,
        priority: mx.preference
      })
    })
  }

  // Add DKIM records
  if (sharedConfig.email?.dkim) {
    allRecords.push({
      type: 'TXT',
      name: `${sharedConfig.email.dkim.selector}._domainkey`,
      content: `v=DKIM1; k=rsa; p=${sharedConfig.email.dkim.value}`,
      ttl: 3600
    })
  }

  return allRecords
}

/**
 * Get Cloudflare zone configuration
 */
export function getCloudflareConfig(environment: 'development' | 'staging' | 'production'): any {
  const zoneConfig = getDNSConfig(environment)

  if (!zoneConfig.cloudflare.enabled) {
    return null
  }

  return zoneConfig.cloudflare
}

/**
 * Generate DNS records for Cloudflare API
 */
export function generateCloudflareDNSRecords(environment: 'development' | 'staging' | 'production'): any[] {
  const records = getDNSRecords(environment)

  return records.map(record => {
    const cloudflareRecord: any = {
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl
    }

    // Add Cloudflare-specific properties
    if (record.proxied !== undefined) {
      cloudflareRecord.proxied = record.proxied
    }

    if (record.priority) {
      cloudflareRecord.priority = record.priority
    }

    // Handle SRV records
    if (record.type === 'SRV') {
      cloudflareRecord.service = record.service
      cloudflareRecord.proto = record.proto
      cloudflareRecord.port = record.port
      cloudflareRecord.weight = record.weight
      cloudflareRecord.tag = record.tag
    }

    // Handle CAA records
    if (record.type === 'CAA') {
      cloudflareRecord.flags = record.flags
      cloudflareRecord.tag = record.tag
    }

    // Handle DNSSEC records
    if (record.type === 'DNSKEY' || record.type === 'DS') {
      cloudflareRecord.flags = record.flags
      cloudflareRecord.key_tag = record.key_tag
      cloudflareRecord.algorithm = record.algorithm
      cloudflareRecord.digest_type = record.digest_type
      cloudflareRecord.digest = record.digest
    }

    return cloudflareRecord
  })
}

/**
 * Validate DNS configuration
 */
export function validateDNSConfig(environment: 'development' | 'staging' | 'production'): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const zoneConfig = getDNSConfig(environment)

  try {
    // Validate domain
    if (!zoneConfig.domain) {
      errors.push('Domain is required')
    }

    // Validate required records
    const requiredRecords = ['A', 'CNAME']
    const hasARecord = zoneConfig.records.some(r => r.type === 'A' && r.name === '@')
    const hasCnameRecord = zoneConfig.records.some(r => r.type === 'CNAME')

    if (!hasARecord && !hasCnameRecord) {
      errors.push('Either an A record or CNAME record is required for the domain')
    }

    // Validate Cloudflare configuration
    if (zoneConfig.cloudflare.enabled) {
      if (!zoneConfig.cloudflare.zoneId) {
        errors.push('Cloudflare zone ID is required when Cloudflare is enabled')
      }

      if (!['off', 'full', 'full_strict'].includes(zoneConfig.cloudflare.sslMode)) {
        errors.push('Invalid SSL mode. Must be one of: off, full, full_strict')
      }
    }

    // Validate records
    zoneConfig.records.forEach((record, index) => {
      if (!record.type) {
        errors.push(`Record ${index + 1}: type is required`)
      }

      if (!record.name) {
        errors.push(`Record ${index + 1}: name is required`)
      }

      if (!record.content) {
        errors.push(`Record ${index + 1}: content is required`)
      }

      if (!record.ttl || record.ttl < 60 || record.ttl > 86400) {
        errors.push(`Record ${index + 1}: TTL must be between 60 and 86400`)
      }

      // Validate MX records
      if (record.type === 'MX') {
        if (!record.priority || record.priority < 0 || record.priority > 65535) {
          errors.push(`MX Record ${index + 1}: priority must be between 0 and 65535`)
        }
      }

      // Validate SRV records
      if (record.type === 'SRV') {
        if (!record.port || record.port < 1 || record.port > 65535) {
          errors.push(`SRV Record ${index + 1}: port must be between 1 and 65535`)
        }

        if (!record.weight || record.weight < 0 || record.weight > 65535) {
          errors.push(`SRV Record ${index + 1}: weight must be between 0 and 65535`)
        }
      }
    })

  } catch (error) {
    errors.push(`Configuration validation error: ${error}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Replace environment variables in configuration
 */
function replaceEnvironmentVariables(config: DNSZone): DNSZone {
  const configString = JSON.stringify(config)

  // Replace ${VAR_NAME} patterns with actual environment variables
  const replacedString = configString.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    return process.env[varName] || match
  })

  return JSON.parse(replacedString)
}

/**
 * Generate DNS record changes for deployment
 */
export function generateDNSChanges(
  fromEnvironment: 'development' | 'staging' | 'production',
  toEnvironment: 'development' | 'staging' | 'production'
): {
  additions: DNSRecord[]
  removals: DNSRecord[]
  modifications: DNSRecord[]
} {
  const fromRecords = getDNSRecords(fromEnvironment)
  const toRecords = getDNSRecords(toEnvironment)

  const additions: DNSRecord[] = []
  const removals: DNSRecord[] = []
  const modifications: DNSRecord[] = []

  // Create a map of existing records for easier comparison
  const fromRecordsMap = new Map<string, DNSRecord>()
  fromRecords.forEach(record => {
    const key = `${record.type}-${record.name}-${record.content}`
    fromRecordsMap.set(key, record)
  })

  // Find additions and modifications
  toRecords.forEach(record => {
    const key = `${record.type}-${record.name}-${record.content}`
    const existingRecord = fromRecordsMap.get(key)

    if (!existingRecord) {
      additions.push(record)
    } else if (JSON.stringify(existingRecord) !== JSON.stringify(record)) {
      modifications.push(record)
    }
  })

  // Find removals
  const toRecordsMap = new Map<string, DNSRecord>()
  toRecords.forEach(record => {
    const key = `${record.type}-${record.name}-${record.content}`
    toRecordsMap.set(key, record)
  })

  fromRecords.forEach(record => {
    const key = `${record.type}-${record.name}-${record.content}`
    if (!toRecordsMap.has(key)) {
      removals.push(record)
    }
  })

  return {
    additions,
    removals,
    modifications
  }
}

/**
 * Export DNS configuration as JSON for external tools
 */
export function exportDNSConfig(environment: 'development' | 'staging' | 'production'): string {
  const config = getDNSConfig(environment)
  const records = getDNSRecords(environment)

  return JSON.stringify({
    zone: config,
    records: records
  }, null, 2)
}

/**
 * Get domain health check endpoints
 */
export function getHealthCheckEndpoints(environment: 'development' | 'staging' | 'production'): string[] {
  const zoneConfig = getDNSConfig(environment)

  return [
    `https://${zoneConfig.domain}/health`,
    `https://${zoneConfig.subdomains.api}/health`,
    `https://${zoneConfig.subdomains.app}/health`
  ].filter(url => url && !url.includes('localhost'))
}

// Default export
export default {
  getDNSConfig,
  getDNSRecords,
  getCloudflareConfig,
  generateCloudflareDNSRecords,
  validateDNSConfig,
  generateDNSChanges,
  exportDNSConfig,
  getHealthCheckEndpoints
}
