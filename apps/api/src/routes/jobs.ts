import { Hono } from 'hono'
import { v4 as uuidv4 } from 'uuid'

// In-memory job storage for MVP
// In production, this would use Durable Objects or database
const jobs = new Map<string, any>()

const app = new Hono()

// Create a new job
app.post('/', async (c) => {
  try {
    const body = await c.req.json()

    // Validate required parameters
    if (!body.tool_id) {
      return c.json({ error: 'Missing required parameter: tool_id' }, 400)
    }

    if (!body.input_data && !body.input_ref) {
      return c.json({ error: 'Either input_data or input_ref must be provided' }, 400)
    }

    // Validate tool_id
    const validToolIds = ['json-format', 'json-validate', 'json-convert', 'code-execute', 'code-format']
    if (!validToolIds.includes(body.tool_id)) {
      return c.json({ error: 'Invalid tool_id' }, 400)
    }

    const jobId = uuidv4()
    const now = Math.floor(Date.now() / 1000)

    const job = {
      id: jobId,
      user_id: null, // MVP doesn't require authentication
      tool_id: body.tool_id,
      status: 'pending',
      input_data: body.input_data || null,
      input_ref: body.input_ref || null,
      output_data: null,
      progress: 0,
      error_message: null,
      retry_count: 0,
      started_at: null,
      completed_at: null,
      created_at: now,
      updated_at: now
    }

    jobs.set(jobId, job)

    // Start processing the job asynchronously
    processJobAsync(jobId)

    return c.json(job, 201)
  } catch (error) {
    return c.json({ error: 'Invalid request format' }, 400)
  }
})

// Get job by ID
app.get('/:id', async (c) => {
  const jobId = c.req.param('id')

  // Validate job ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(jobId)) {
    return c.json({ error: 'Invalid job ID format' }, 400)
  }

  const job = jobs.get(jobId)
  if (!job) {
    return c.json({ error: 'Job not found' }, 404)
  }

  return c.json(job)
})

// Update job (internal use for async processing)
app.patch('/:id', async (c) => {
  const jobId = c.req.param('id')
  const body = await c.req.json()

  const job = jobs.get(jobId)
  if (!job) {
    return c.json({ error: 'Job not found' }, 404)
  }

  // Update job properties
  if (body.status !== undefined) {
    job.status = body.status
  }
  if (body.output_data !== undefined) {
    job.output_data = body.output_data
  }
  if (body.progress !== undefined) {
    job.progress = Math.max(0, Math.min(100, body.progress))
  }
  if (body.error_message !== undefined) {
    job.error_message = body.error_message
  }
  if (body.started_at !== undefined) {
    job.started_at = body.started_at
  }
  if (body.completed_at !== undefined) {
    job.completed_at = body.completed_at
  }

  job.updated_at = Math.floor(Date.now() / 1000)

  jobs.set(jobId, job)
  return c.json(job)
})

// Delete job
app.delete('/:id', async (c) => {
  const jobId = c.req.param('id')

  const job = jobs.get(jobId)
  if (!job) {
    return c.json({ error: 'Job not found' }, 404)
  }

  jobs.delete(jobId)
  return c.json({ message: 'Job deleted successfully' })
})

// List jobs (optional, for admin/debug)
app.get('/', async (c) => {
  const status = c.req.query('status')
  const toolId = c.req.query('tool_id')
  const limit = parseInt(c.req.query('limit') || '10')
  const offset = parseInt(c.req.query('offset') || '0')

  let allJobs = Array.from(jobs.values())

  // Apply filters
  if (status) {
    allJobs = allJobs.filter(job => job.status === status)
  }
  if (toolId) {
    allJobs = allJobs.filter(job => job.tool_id === toolId)
  }

  // Sort by created_at descending
  allJobs.sort((a, b) => b.created_at - a.created_at)

  // Apply pagination
  const paginatedJobs = allJobs.slice(offset, offset + limit)

  return c.json({
    jobs: paginatedJobs,
    total: allJobs.length,
    limit,
    offset
  })
})

// Async job processing simulation
async function processJobAsync(jobId: string) {
  const job = jobs.get(jobId)
  if (!job) return

  try {
    // Update status to running
    job.status = 'running'
    job.started_at = Math.floor(Date.now() / 1000)
    job.updated_at = job.started_at
    jobs.set(jobId, job)

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Process the job based on tool_id
    let result: any = {}

    switch (job.tool_id) {
      case 'json-format':
        if (job.input_data?.json) {
          try {
            const parsed = JSON.parse(job.input_data.json)
            const formatted = JSON.stringify(parsed, null, job.input_data.indent || 2)
            result = { formatted, valid: true, size: formatted.length }
          } catch (error) {
            result = { formatted: null, valid: false, errors: [{ message: error instanceof Error ? error.message : 'Invalid JSON' }] }
          }
        }
        break

      case 'json-validate':
        if (job.input_data?.json) {
          try {
            JSON.parse(job.input_data.json)
            result = { valid: true, errors: [] }
          } catch (error) {
            result = { valid: false, errors: [{ message: error instanceof Error ? error.message : 'Invalid JSON' }] }
          }
        }
        break

      case 'code-execute':
        if (job.input_data?.code) {
          // Mock code execution
          result = {
            output: 'Mock output\n',
            exit_code: 0,
            execution_time: 45,
            memory_usage: 1024000
          }
        }
        break

      default:
        throw new Error(`Unknown tool_id: ${job.tool_id}`)
    }

    // Update job with results
    job.status = 'completed'
    job.output_data = result
    job.progress = 100
    job.completed_at = Math.floor(Date.now() / 1000)
    job.updated_at = job.completed_at

  } catch (error) {
    // Handle errors
    job.status = 'failed'
    job.error_message = error instanceof Error ? error.message : 'Unknown error'
    job.completed_at = Math.floor(Date.now() / 1000)
    job.updated_at = job.completed_at
  }

  jobs.set(jobId, job)
}

export { app as jobs }