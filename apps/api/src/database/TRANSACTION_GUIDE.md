# Database Transaction Support

This guide covers the enhanced database transaction system implemented in the application, providing ACID compliance, comprehensive monitoring, and utility functions for complex operations.

## Overview

The transaction system includes:

- **Enhanced Transaction Management**: Full ACID properties with configurable isolation levels
- **Transaction Monitoring**: Real-time monitoring with alerts and performance analysis
- **Utility Functions**: Common patterns and templates for transaction operations
- **Integration**: Seamless integration with existing database client and services

## Quick Start

### Basic Transaction Usage

```typescript
import { DatabaseClient, IsolationLevel } from '../database'

const dbClient = new DatabaseClient(d1Database)

// Simple transaction
const result = await dbClient.enhancedTransaction(async (tx) => {
  await tx.execute('INSERT INTO users (id, email) VALUES (?, ?)', [userId, email])
  await tx.execute('INSERT INTO audit_log (user_id, action) VALUES (?, ?)', [userId, 'created'])
  
  return { userId, email }
}, {
  isolationLevel: IsolationLevel.READ_COMMITTED,
  timeout: 10000
})
```

### Using Transaction Templates

```typescript
import { TransactionTemplates } from '../database'

// Use predefined template
const result = await dbClient.executeTemplate('create_user', {
  userId: 'user-123',
  email: 'user@example.com',
  name: 'John Doe'
})
```

### Batch Operations

```typescript
const operations = [
  { sql: 'UPDATE accounts SET balance = balance - ? WHERE id = ?', params: [100, 'acc1'], expectedResult: 'changes' },
  { sql: 'UPDATE accounts SET balance = balance + ? WHERE id = ?', params: [100, 'acc2'], expectedResult: 'changes' }
]

const results = await dbClient.executeBatch(operations, {
  isolationLevel: IsolationLevel.SERIALIZABLE,
  timeout: 15000
})
```

## Features

### 1. Enhanced Transaction Class

The `EnhancedTransaction` class provides:

- **ACID Properties**: Atomicity, Consistency, Isolation, Durability
- **Configurable Isolation Levels**: READ_UNCOMMITTED, READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE
- **Savepoints**: Create and rollback to savepoints within transactions
- **Timeout Handling**: Configurable transaction timeouts with automatic rollback
- **Retry Logic**: Automatic retry on deadlocks and timeouts
- **Comprehensive Metrics**: Detailed transaction monitoring and logging

```typescript
const transaction = new EnhancedTransaction(connection, {
  isolationLevel: IsolationLevel.SERIALIZABLE,
  timeout: 30000,
  retryAttempts: 3,
  enableMetrics: true,
  enableLogging: true
})

// Create savepoint
await transaction.createSavepoint({ name: 'before_critical_operation' })

// Execute operations
await transaction.execute('UPDATE sensitive_table SET value = ? WHERE id = ?', [newValue, id])

// Rollback to savepoint if needed
await transaction.rollbackToSavepoint('before_critical_operation')

// Commit transaction
await transaction.commit()
```

### 2. Transaction Manager

The `TransactionManager` handles multiple concurrent transactions:

```typescript
import { globalTransactionManager } from '../database'

// Create transaction
const transaction = globalTransactionManager.createTransaction(connection, {
  isolationLevel: IsolationLevel.READ_COMMITTED
})

// Get active transactions
const activeTransactions = globalTransactionManager.getActiveTransactions()

// Cleanup completed transactions
const cleanedCount = globalTransactionManager.cleanup()
```

### 3. Transaction Monitoring

Real-time monitoring with alerts and performance analysis:

```typescript
import { globalTransactionMonitor } from '../database'

// Start monitoring
globalTransactionMonitor.startMonitoring(transactionManager)

// Add alert callback
globalTransactionMonitor.onAlert((alert) => {
  console.warn(`Transaction alert: ${alert.message}`)
})

// Generate report
const report = globalTransactionMonitor.generateReport(3600000) // Last hour
console.log('Success rate:', report.summary.successRate)
console.log('Average duration:', report.summary.averageDuration)
```

### 4. Transaction Templates

Pre-defined templates for common operations:

```typescript
import { TransactionTemplates } from '../database'

// User creation with audit logging
const userTemplate = TransactionTemplates.createUser(userId, email, name)

// File upload with quota checking
const fileTemplate = TransactionTemplates.uploadFile(fileId, userId, filename, fileSize)

// Batch updates
const batchTemplate = TransactionTemplates.batchUpdate([
  { table: 'users', id: 'user1', data: { name: 'New Name' } },
  { table: 'users', id: 'user2', data: { email: 'new@email.com' } }
])
```

### 5. Utility Functions

Helper functions for common patterns:

```typescript
import { TransactionHelper } from '../database'

// Execute with retry on deadlock
await TransactionHelper.withRetryableTransaction(connection, async (tx) => {
  // Your transaction logic here
}, {
  maxRetries: 5,
  retryDelay: 2000
})

// Execute conditional transaction
await TransactionHelper.executeConditional(
  connection,
  async (tx) => {
    const user = await tx.queryFirst('SELECT subscription_tier FROM users WHERE id = ?', [userId])
    return user?.subscription_tier === 'premium'
  },
  [{ sql: 'UPDATE premium_features SET enabled = 1 WHERE user_id = ?', params: [userId] }],
  [{ sql: 'UPDATE basic_features SET enabled = 1 WHERE user_id = ?', params: [userId] }]
)
```

## Configuration

### Database Client Configuration

```typescript
const dbClient = new DatabaseClient(d1Database, {
  enableTransactions: true,
  isolationLevel: 'READ_COMMITTED',
  maxConnections: 10,
  connectionTimeoutMs: 30000,
  retryAttempts: 3,
  enableMetrics: true
})
```

### Transaction Configuration

```typescript
const transactionConfig: TransactionConfig = {
  isolationLevel: IsolationLevel.READ_COMMITTED,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  readOnly: false,
  deferrable: false,
  deadlockDetection: true,
  enableMetrics: true,
  enableLogging: true
}
```

### Monitoring Configuration

```typescript
const monitoringConfig: TransactionMonitoringConfig = {
  enabled: true,
  slowTransactionThreshold: 5000,
  maxQueryHistory: 10000,
  enableAlerts: true,
  enableMetricsExport: true,
  alertingThresholds: {
    maxDuration: 30000,
    maxQueryCount: 100,
    maxFailureRate: 5,
    maxDeadlockRate: 1
  }
}
```

## Best Practices

### 1. Choose Appropriate Isolation Levels

- **READ_UNCOMMITTED**: Fastest, but allows dirty reads
- **READ_COMMITTED**: Good balance of performance and consistency (default)
- **REPEATABLE_READ**: Prevents non-repeatable reads
- **SERIALIZABLE**: Highest consistency, but lowest performance

```typescript
// For critical financial operations
await dbClient.enhancedTransaction(async (tx) => {
  // Transfer money between accounts
}, {
  isolationLevel: IsolationLevel.SERIALIZABLE
})

// For reporting queries
await dbClient.enhancedTransaction(async (tx) => {
  // Generate reports
}, {
  isolationLevel: IsolationLevel.READ_COMMITTED,
  readOnly: true
})
```

### 2. Handle Timeouts Appropriately

```typescript
try {
  await dbClient.enhancedTransaction(async (tx) => {
    // Complex operations
  }, {
    timeout: 15000, // 15 seconds
    retryAttempts: 2
  })
} catch (error) {
  if (error.message.includes('timeout')) {
    // Handle timeout gracefully
    console.error('Transaction timed out:', error.message)
  }
  throw error
}
```

### 3. Use Savepoints for Complex Operations

```typescript
await dbClient.enhancedTransaction(async (tx) => {
  const savepoint = await tx.createSavepoint({ name: 'before_validation' })
  
  try {
    // Validate and update data
    await tx.execute('UPDATE complex_table SET status = ? WHERE id = ?', ['processing', id])
    
    // More operations...
    
  } catch (validationError) {
    // Rollback to savepoint if validation fails
    await tx.rollbackToSavepoint(savepoint.savepointName)
    throw validationError
  }
})
```

### 4. Monitor Performance

```typescript
// Set up monitoring
globalTransactionMonitor.startMonitoring(transactionManager)

// Check for performance issues
const report = globalTransactionMonitor.generateReport()
if (report.summary.successRate < 95) {
  console.warn('Transaction success rate is low:', report.summary.successRate)
}

// Get performance recommendations
const activeTransactions = transactionManager.getActiveTransactions()
activeTransactions.forEach(tx => {
  const analysis = TransactionUtils.analyzePerformance(tx)
  if (analysis.score < 70) {
    console.warn(`Transaction ${tx.id} performance issues:`, analysis.issues)
  }
})
```

### 5. Use Templates for Common Operations

```typescript
// Instead of writing custom transaction logic, use templates
const result = await dbClient.executeTemplate('create_user', {
  userId: 'user-123',
  email: 'user@example.com',
  name: 'John Doe'
})

// This handles user creation and audit logging automatically
```

## Error Handling

### Common Transaction Errors

```typescript
try {
  await dbClient.enhancedTransaction(async (tx) => {
    // Transaction operations
  })
} catch (error) {
  if (error.message.includes('deadlock')) {
    // Handle deadlock - system will retry automatically
    console.log('Deadlock detected, retrying...')
  } else if (error.message.includes('timeout')) {
    // Handle timeout
    console.error('Transaction timed out:', error.message)
  } else if (error.message.includes('constraint')) {
    // Handle constraint violation
    console.error('Constraint violation:', error.message)
  } else {
    // Handle other errors
    console.error('Transaction failed:', error.message)
  }
}
```

### Custom Error Handling in Templates

```typescript
const template = {
  name: 'custom_operation',
  operations: [
    { sql: 'INSERT INTO table1 (col1) VALUES (?)', params: [value1] },
    { sql: 'INSERT INTO table2 (col2) VALUES (?)', params: [value2] }
  ],
  onError: (error) => {
    if (error.message.includes('constraint')) {
      throw new Error('Custom constraint error message')
    }
    throw error
  }
}
```

## Monitoring and Alerting

### Real-time Monitoring

```typescript
// Start monitoring
globalTransactionMonitor.startMonitoring(transactionManager)

// Set up alert webhook
globalTransactionMonitor.onAlert((alert) => {
  if (alert.severity === 'critical') {
    // Send notification
    sendAlertNotification(alert)
  }
})
```

### Performance Analysis

```typescript
// Analyze transaction performance
const report = globalTransactionMonitor.generateReport()

console.log('Transaction Summary:', {
  total: report.summary.totalTransactions,
  successRate: report.summary.successRate,
  averageDuration: report.summary.averageDuration,
  deadlockRate: report.summary.deadlockRate
})

console.log('Performance Issues:', report.performance.slowestTransactions.slice(0, 5))
console.log('Recommendations:', report.recommendations)
```

### API Monitoring

The system provides REST API endpoints for monitoring:

- `GET /api/transactions/dashboard` - Real-time dashboard data
- `GET /api/transactions/metrics` - Transaction metrics and analytics
- `GET /api/transactions/alerts` - Active alerts
- `GET /api/transactions/export/:format` - Export metrics (json, prometheus, csv)
- `GET /api/transactions/performance` - Performance analysis

## Integration Examples

### Service Integration

```typescript
export class UserService {
  constructor(private dbClient: DatabaseClient) {}

  async createUserWithProfile(userData: any, profileData: any) {
    return this.dbClient.enhancedTransaction(async (tx) => {
      // Create user
      await tx.execute('INSERT INTO users (id, email) VALUES (?, ?)', [userData.id, userData.email])
      
      // Create profile
      await tx.execute('INSERT INTO profiles (user_id, name) VALUES (?, ?)', [userData.id, profileData.name])
      
      // Log audit event
      await tx.execute('INSERT INTO audit_log (user_id, action) VALUES (?, ?)', [userData.id, 'user_created'])
      
      return userData.id
    }, {
      isolationLevel: IsolationLevel.READ_COMMITTED,
      timeout: 10000
    })
  }
}
```

### API Integration

```typescript
app.post('/api/users', async (c) => {
  const userData = await c.req.json()
  const dbClient = c.get('dbClient')
  
  try {
    const userId = await dbClient.executeTemplate('create_user', {
      userId: crypto.randomUUID(),
      email: userData.email,
      name: userData.name
    })
    
    return c.json({ success: true, userId })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 400)
  }
})
```

## Migration Guide

### Upgrading from Basic Transactions

1. **Replace existing transaction calls**:
   ```typescript
   // Old
   const result = await dbClient.transaction(async (tx) => {
     await tx.execute('INSERT INTO users (email) VALUES (?)', [email])
     return email
   })
   
   // New
   const result = await dbClient.enhancedTransaction(async (tx) => {
     await tx.execute('INSERT INTO users (email) VALUES (?)', [email])
     return email
   }, {
     isolationLevel: IsolationLevel.READ_COMMITTED
   })
   ```

2. **Add monitoring**:
   ```typescript
   // Start monitoring in your application startup
   globalTransactionMonitor.startMonitoring(globalTransactionManager)
   ```

3. **Use templates for common operations**:
   ```typescript
   // Replace manual user creation with template
   const result = await dbClient.executeTemplate('create_user', userData)
   ```

## Troubleshooting

### Common Issues

1. **Deadlocks**: Use lower isolation levels or optimize query order
2. **Timeouts**: Increase timeout or optimize queries
3. **High memory usage**: Reduce transaction history retention
4. **Performance issues**: Use performance analysis to identify bottlenecks

### Debugging

```typescript
// Enable detailed logging
const transaction = new EnhancedTransaction(connection, {
  enableLogging: true,
  enableMetrics: true
})

// Get query history
const history = transaction.getQueryHistory()
console.log('Transaction queries:', history)

// Analyze performance
const analysis = TransactionUtils.analyzePerformance(transaction)
console.log('Performance analysis:', analysis)
```

## API Reference

### EnhancedTransaction

- `query<T>(sql, params?)` - Execute query and return results
- `queryFirst<T>(sql, params?)` - Execute query and return first result
- `execute(sql, params?)` - Execute statement and return metadata
- `createSavepoint(options?)` - Create savepoint
- `rollbackToSavepoint(name)` - Rollback to savepoint
- `commit()` - Commit transaction
- `rollback(reason?)` - Rollback transaction

### TransactionHelper

- `withTransaction(connection, callback, config?)` - Execute with transaction
- `withRetryableTransaction(connection, callback, config?)` - Execute with retry
- `executeBatch(connection, operations, config?)` - Execute batch operations
- `executeTemplate(connection, template, context?)` - Execute template

### TransactionMonitor

- `startMonitoring(transactionManager)` - Start monitoring
- `generateReport(timeRange?)` - Generate performance report
- `getActiveAlerts()` - Get active alerts
- `exportMetrics(format)` - Export metrics

For detailed API documentation, refer to the TypeScript definitions in the source files.