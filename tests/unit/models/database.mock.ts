import { vi } from 'vitest'

// Mock D1 database interface for testing
export interface MockD1Database {
  prepare: (query: string) => MockD1Statement
  batch: (statements: MockD1Statement[]) => Promise<MockD1BatchResult>
  dump: () => Promise<Array<{ sql: string; args: any[] }>>
}

export interface MockD1Statement {
  bind: (...args: any[]) => MockD1Statement
  first: <T = any>() => Promise<T | null>
  run: () => Promise<MockD1Result>
  all: () => Promise<MockD1ResultAll>
}

export interface MockD1Result {
  success: boolean
  meta: {
    duration: number
    last_row_id: number
    changes: number
    served_by: string
  }
  error?: string
}

export interface MockD1ResultAll {
  results: any[]
  success: boolean
  meta: {
    duration: number
    served_by: string
  }
  error?: string
}

export interface MockD1BatchResult {
  success: boolean
  results: MockD1Result[]
  error?: string
}

// Mock D1 database implementation
export class createMockD1Database implements MockD1Database {
  private data: Map<string, any[]> = new Map()
  private batchResults: MockD1BatchResult[] = []

  constructor(initialData?: Record<string, any[]>) {
    if (initialData) {
      Object.entries(initialData).forEach(([table, rows]) => {
        this.data.set(table, rows)
      })
    }
  }

  prepare(query: string): MockD1Statement {
    return new MockD1Statement(query, this.data)
  }

  batch(statements: MockD1Statement[]): Promise<MockD1BatchResult> {
    const results = statements.map(_stmt => ({
      success: true,
      meta: {
        duration: 1,
        last_row_id: 1,
        changes: 1,
        served_by: 'mock',
      },
    }))

    this.batchResults.push({ success: true, results })
    return Promise.resolve({ success: true, results })
  }

  dump(): Promise<Array<{ sql: string; args: any[] }>> {
    return Promise.resolve([])
  }

  // Helper methods for testing
  setTableData(table: string, data: any[]): void {
    this.data.set(table, data)
  }

  getTableData(table: string): any[] {
    return this.data.get(table) || []
  }

  clearTable(table: string): void {
    this.data.set(table, [])
  }

  clearAllTables(): void {
    this.data.clear()
  }

  getLastBatchResults(): MockD1BatchResult[] {
    return this.batchResults
  }

  clearBatchResults(): void {
    this.batchResults = []
  }
}

export class MockD1Statement implements MockD1Statement {
  private query: string
  private data: Map<string, any[]>
  private boundArgs: any[] = []

  constructor(query: string, data: Map<string, any[]>) {
    this.query = query
    this.data = data
  }

  bind(...args: any[]): MockD1Statement {
    this.boundArgs = args
    return this
  }

  async first<T = any>(): Promise<T | null> {
    const results = await this.all()
    return results.results[0] || null
  }

  async run(): Promise<MockD1Result> {
    const startTime = Date.now()

    try {
      const result = this.executeQuery()
      const duration = Date.now() - startTime

      return {
        success: true,
        meta: {
          duration,
          last_row_id: 1,
          changes: result.changes || 0,
          served_by: 'mock',
        },
      }
    } catch (error) {
      return {
        success: false,
        meta: {
          duration: Date.now() - startTime,
          last_row_id: 0,
          changes: 0,
          served_by: 'mock',
        },
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async all(): Promise<MockD1ResultAll> {
    const startTime = Date.now()

    try {
      const results = this.executeQuery()
      const duration = Date.now() - startTime

      return {
        results: results.data || [],
        success: true,
        meta: {
          duration,
          served_by: 'mock',
        },
      }
    } catch (error) {
      return {
        results: [],
        success: false,
        meta: {
          duration: Date.now() - startTime,
          served_by: 'mock',
        },
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private executeQuery(): { data?: any[]; changes?: number } {
    const trimmedQuery = this.query.trim().toLowerCase()

    // Handle different query types
    if (trimmedQuery.startsWith('select')) {
      return this.handleSelect()
    } else if (trimmedQuery.startsWith('insert')) {
      return this.handleInsert()
    } else if (trimmedQuery.startsWith('update')) {
      return this.handleUpdate()
    } else if (trimmedQuery.startsWith('delete')) {
      return this.handleDelete()
    } else if (trimmedQuery.startsWith('create')) {
      return { changes: 0 }
    } else {
      throw new Error(`Unsupported query type: ${this.query}`)
    }
  }

  private handleSelect(): { data: any[] } {
    // Simple mock for SELECT queries
    // This is a basic implementation - in practice you'd want to parse the query more carefully
    const tableName = this.extractTableName()
    const tableData = this.data.get(tableName) || []

    // Apply basic WHERE clause filtering
    let filteredData = [...tableData]

    if (this.boundArgs.length > 0 && this.query.includes('WHERE')) {
      // Simple WHERE clause handling for equality checks
      const whereClause = this.query.split('WHERE')[1].split('ORDER')[0].split('LIMIT')[0]
      const conditions = whereClause.split('AND').map(c => c.trim())

      filteredData = tableData.filter(row => {
        return conditions.every((condition, index) => {
          if (condition.includes('=')) {
            const [column, _] = condition.split('=').map(s => s.trim())
            const value = this.boundArgs[index]
            return row[column] === value
          }
          return true
        })
      })
    }

    // Apply ORDER BY
    if (this.query.includes('ORDER BY')) {
      const orderClause = this.query.split('ORDER BY')[1].split('LIMIT')[0].trim()
      const [column, direction] = orderClause.split(' ')

      filteredData.sort((a, b) => {
        if (direction.toUpperCase() === 'DESC') {
          return b[column] > a[column] ? 1 : -1
        } else {
          return a[column] > b[column] ? 1 : -1
        }
      })
    }

    // Apply LIMIT
    if (this.query.includes('LIMIT')) {
      const limitMatch = this.query.match(/LIMIT\s+(\d+)/i)
      if (limitMatch) {
        const limit = parseInt(limitMatch[1], 10)
        filteredData = filteredData.slice(0, limit)
      }
    }

    // Apply OFFSET
    if (this.query.includes('OFFSET')) {
      const offsetMatch = this.query.match(/OFFSET\s+(\d+)/i)
      if (offsetMatch) {
        const offset = parseInt(offsetMatch[1], 10)
        filteredData = filteredData.slice(offset)
      }
    }

    return { data: filteredData }
  }

  private handleInsert(): { changes: number } {
    const tableName = this.extractTableName()
    const tableData = this.data.get(tableName) || []

    // Create a mock row from bound arguments
    const newRow: any = {}
    const columns = this.extractInsertColumns()

    columns.forEach((column, index) => {
      newRow[column] = this.boundArgs[index]
    })

    tableData.push(newRow)
    this.data.set(tableName, tableData)

    return { changes: 1 }
  }

  private handleUpdate(): { changes: number } {
    const tableName = this.extractTableName()
    const tableData = this.data.get(tableName) || []

    let changes = 0

    if (this.boundArgs.length > 0 && this.query.includes('WHERE')) {
      const whereIndex = this.boundArgs.length - 1 // WHERE clause is usually the last bound arg
      const whereValue = this.boundArgs[whereIndex]

      // Simple WHERE clause handling
      tableData.forEach(row => {
        if (row.id === whereValue) {
          // Update fields (simplified - would need better parsing in practice)
          if (this.query.includes('name = ?')) {
            row.name = this.boundArgs[0]
            changes++
          }
          if (this.query.includes('email = ?')) {
            row.email = this.boundArgs[this.query.includes('name = ?') ? 1 : 0]
            changes++
          }
          if (this.query.includes('updated_at = ?')) {
            row.updated_at = this.boundArgs[this.boundArgs.length - 2]
          }
        }
      })
    }

    return { changes }
  }

  private handleDelete(): { changes: number } {
    const tableName = this.extractTableName()
    const tableData = this.data.get(tableName) || []

    let changes = 0

    if (this.boundArgs.length > 0) {
      const originalLength = tableData.length
      const filteredData = tableData.filter(row => row.id !== this.boundArgs[0])
      this.data.set(tableName, filteredData)
      changes = originalLength - filteredData.length
    }

    return { changes }
  }

  private extractTableName(): string {
    // Simple table name extraction - would need more sophisticated parsing in practice
    const fromMatch = this.query.match(/FROM\s+(\w+)/i)
    if (fromMatch) return fromMatch[1]

    const intoMatch = this.query.match(/INTO\s+(\w+)/i)
    if (intoMatch) return intoMatch[1]

    const updateMatch = this.query.match(/UPDATE\s+(\w+)/i)
    if (updateMatch) return updateMatch[1]

    return 'unknown'
  }

  private extractInsertColumns(): string[] {
    // Extract column names from INSERT query
    const columnsMatch = this.query.match(/\(([^)]+)\)/i)
    if (columnsMatch) {
      return columnsMatch[1].split(',').map(col => col.trim())
    }
    return []
  }
}

// Helper function to create a mock database with test data
export function createTestDatabase(data?: Record<string, any[]>): MockD1Database {
  return new createMockD1Database(data)
}

// Helper function to create mock model data
export function createMockUser(overrides?: Partial<any>): any {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: null,
    subscription_tier: 'free',
    preferences: null,
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
    last_login_at: null,
    ...overrides,
  }
}

export function createMockAuthIdentity(overrides?: Partial<any>): any {
  return {
    id: 'auth-123',
    user_id: 'user-123',
    provider: 'google',
    provider_uid: 'google-123',
    provider_data: JSON.stringify({
      sub: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
      email_verified: true,
    }),
    created_at: Math.floor(Date.now() / 1000),
    ...overrides,
  }
}

export function createMockTool(overrides?: Partial<any>): any {
  return {
    id: 'tool-123',
    slug: 'json-format',
    name: 'JSON Formatter',
    category: 'json',
    description: 'Format JSON data',
    config: JSON.stringify({
      inputSchema: { type: 'string' },
      outputSchema: { type: 'string' },
      executionMode: 'sync',
      quotas: {
        maxInputSize: 1024 * 1024,
        maxExecutionTime: 5000,
        requiresAuth: false,
      },
      parameters: [],
    }),
    enabled: true,
    beta: false,
    sort_order: 0,
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
    ...overrides,
  }
}

export function createMockToolUsage(overrides?: Partial<any>): any {
  return {
    id: 'usage-123',
    user_id: 'user-123',
    tool_id: 'tool-123',
    job_id: 'job-123',
    input_size: 1024,
    output_size: 2048,
    execution_time: 1500,
    success: true,
    error_message: null,
    metadata: JSON.stringify({}),
    created_at: Math.floor(Date.now() / 1000),
    ...overrides,
  }
}

export function createMockJob(overrides?: Partial<any>): any {
  return {
    id: 'job-123',
    user_id: 'user-123',
    tool_id: 'tool-123',
    status: 'completed',
    input_data: JSON.stringify({ test: 'data' }),
    output_data: JSON.stringify({ result: 'success' }),
    error_message: null,
    progress: 100,
    started_at: Math.floor(Date.now() / 1000),
    completed_at: Math.floor(Date.now() / 1000),
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
    ...overrides,
  }
}

export function createMockFileUpload(overrides?: Partial<any>): any {
  return {
    id: 'file-123',
    user_id: 'user-123',
    filename: 'test.json',
    original_name: 'test.json',
    content_type: 'application/json',
    size: 1024,
    path: '/uploads/test-123.json',
    hash: 'sha256:abc123',
    metadata: JSON.stringify({}),
    created_at: Math.floor(Date.now() / 1000),
    expires_at: Math.floor(Date.now() / 1000) + 72 * 3600, // 72 hours
    ...overrides,
  }
}

export function createMockQuotaCounter(overrides?: Partial<any>): any {
  return {
    id: 'quota-123',
    user_id: 'user-123',
    metric: 'api_calls',
    period: 'daily',
    count: 50,
    limit: 100,
    reset_at: Math.floor(Date.now() / 1000) + 24 * 3600, // 24 hours
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
    ...overrides,
  }
}

export function createMockAuditLog(overrides?: Partial<any>): any {
  return {
    id: 'audit-123',
    user_id: 'user-123',
    action: 'tool_used',
    resource_type: 'tool',
    resource_id: 'tool-123',
    metadata: JSON.stringify({}),
    ip_address: '127.0.0.1',
    user_agent: 'test-agent',
    created_at: Math.floor(Date.now() / 1000),
    ...overrides,
  }
}

// Global test setup
export function setupTestEnvironment() {
  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
}

export function cleanupTestEnvironment() {
  vi.restoreAllMocks()
}
