// Main queue system exports
export { JobQueueSystem, WasmToolProcessor } from './job-queue'
export { QueueManager } from './queue-manager'
export { QueueMonitoringSystem } from './queue-monitoring'

// Type exports
export type {
  QueueConfig,
  JobQueueMessage,
  QueueMetrics,
  QueueProcessor,
} from './job-queue'

export type {
  QueueMonitoringMetrics,
  QueueAlertConfig,
  QueueAlert,
} from './queue-monitoring'

// Re-export job-related types
export { JobStatus, JobPriority } from '../models/job'

/**
 * Example usage in Cloudflare Workers:
 *
 * ```typescript
 * import { QueueManager } from '../queues'
 * import { JobService } from '../services/job_service'
 *
 * export default {
 *   async fetch(request, env, ctx) {
 *     const jobService = new JobService({
 *       db: env.DB,
 *       kv: env.CACHE,
 *     })
 *
 *     const queueManager = new QueueManager(jobService, env.DB, env)
 *
 *     // Submit a job
 *     const job = await jobService.createJob({
 *       toolId: 'json-formatter',
 *       userId: 'user123',
 *       inputData: { json: '{"key": "value"}' },
 *     })
 *
 *     await queueManager.submitJob(job, { priority: 'high' })
 *   },
 *
 *   async queue(batch, env) {
 *     const jobService = new JobService({
 *       db: env.DB,
 *       kv: env.CACHE,
 *     })
 *
 *     const queueManager = new QueueManager(jobService, env.DB, env)
 *     await queueManager.processQueues([batch])
 *   }
 * }
 * ```
 */
