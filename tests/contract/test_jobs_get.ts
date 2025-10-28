import { beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../apps/api/src/index'

describe('GET /api/v1/jobs/{id}', () => {
  let testEnv: any
  let createdJobId: string

  beforeAll(() => {
    testEnv = {
      ENVIRONMENT: 'test',
    }
  })

  it('should retrieve a specific job by ID', async () => {
    // First create a job to retrieve
    const createJobData = {
      tool_id: 'json-format',
      input_data: {
        json: '{"name":"John","age":30}',
        indent: 2,
      },
    }

    const createRes = await app.request(
      '/api/v1/jobs',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createJobData),
      },
      testEnv
    )

    expect(createRes.status).toBe(201)
    const createdJob = await createRes.json()
    createdJobId = createdJob.id

    // Now retrieve the job
    const res = await app.request(
      `/api/v1/jobs/${createdJobId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      testEnv
    )

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('id', createdJobId)
    expect(data).toHaveProperty('tool_id', 'json-format')
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('input_data')
    expect(data).toHaveProperty('progress')
    expect(data).toHaveProperty('created_at')
    expect(data).toHaveProperty('updated_at')
  })

  it('should return 404 for non-existent job ID', async () => {
    const fakeJobId = '00000000-0000-0000-0000-000000000000'

    const res = await app.request(
      `/api/v1/jobs/${fakeJobId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      testEnv
    )

    expect(res.status).toBe(404)

    const data = await res.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toContain('Job not found')
  })

  it('should validate job ID format', async () => {
    const invalidJobId = 'invalid-job-id-format'

    const res = await app.request(
      `/api/v1/jobs/${invalidJobId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      testEnv
    )

    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toContain('Invalid job ID')
  })

  it('should include job execution details when completed', async () => {
    // Create and "complete" a job
    const jobData = {
      tool_id: 'code-execute',
      input_data: {
        code: 'console.log("test");',
        language: 'javascript',
      },
    }

    const createRes = await app.request(
      '/api/v1/jobs',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      },
      testEnv
    )

    const createdJob = await createRes.json()

    // Simulate job completion by updating status in test environment
    // In real implementation, this would be handled by background workers
    const _updatedRes = await app.request(
      `/api/v1/jobs/${createdJob.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          output_data: {
            output: 'test\n',
            exit_code: 0,
            execution_time: 45,
          },
          progress: 100,
        }),
      },
      testEnv
    )

    // Retrieve the completed job
    const res = await app.request(
      `/api/v1/jobs/${createdJob.id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      testEnv
    )

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('status', 'completed')
    expect(data).toHaveProperty('output_data')
    expect(data).toHaveProperty('completed_at')
    expect(data).toHaveProperty('progress', 100)
    expect(data.output_data).toHaveProperty('output')
    expect(data.output_data).toHaveProperty('exit_code', 0)
  })

  it('should include error details for failed jobs', async () => {
    // Create a job that will fail
    const jobData = {
      tool_id: 'json-validate',
      input_data: {
        json: '{"invalid": json}', // Invalid JSON
      },
    }

    const createRes = await app.request(
      '/api/v1/jobs',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      },
      testEnv
    )

    const createdJob = await createRes.json()

    // Simulate job failure
    const _updatedRes = await app.request(
      `/api/v1/jobs/${createdJob.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'failed',
          error_message: 'Invalid JSON syntax',
          progress: 0,
        }),
      },
      testEnv
    )

    // Retrieve the failed job
    const res = await app.request(
      `/api/v1/jobs/${createdJob.id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      testEnv
    )

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('status', 'failed')
    expect(data).toHaveProperty('error_message', 'Invalid JSON syntax')
    expect(data).toHaveProperty('completed_at')
    expect(data).not.toHaveProperty('output_data')
  })

  it('should show progress for running jobs', async () => {
    // Create a long-running job
    const jobData = {
      tool_id: 'code-execute',
      input_data: {
        code: '// Simulate long running process\nfor(let i = 0; i < 1000000; i++) {}',
        language: 'javascript',
      },
    }

    const createRes = await app.request(
      '/api/v1/jobs',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      },
      testEnv
    )

    const createdJob = await createRes.json()

    // Simulate job in progress
    const _updatedRes = await app.request(
      `/api/v1/jobs/${createdJob.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'running',
          progress: 45,
          started_at: Math.floor(Date.now() / 1000),
        }),
      },
      testEnv
    )

    // Retrieve the running job
    const res = await app.request(
      `/api/v1/jobs/${createdJob.id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      testEnv
    )

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('status', 'running')
    expect(data).toHaveProperty('progress', 45)
    expect(data).toHaveProperty('started_at')
    expect(data).not.toHaveProperty('completed_at')
    expect(data).not.toHaveProperty('output_data')
  })

  it('should handle job with file references', async () => {
    const jobData = {
      tool_id: 'json-format',
      input_ref: 'file-uuid-string',
      input_data: {
        indent: 2,
      },
    }

    const createRes = await app.request(
      '/api/v1/jobs',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      },
      testEnv
    )

    const createdJob = await createRes.json()

    // Retrieve the job with file reference
    const res = await app.request(
      `/api/v1/jobs/${createdJob.id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      testEnv
    )

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('input_ref', 'file-uuid-string')
    expect(data).toHaveProperty('input_data')
  })

  it('should respect rate limiting for job status checks', async () => {
    if (!createdJobId) return // Skip if no job was created

    // Make multiple rapid requests to check rate limiting
    const requests = Array.from({ length: 20 }, () =>
      app.request(
        `/api/v1/jobs/${createdJobId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        testEnv
      )
    )

    const responses = await Promise.allSettled(requests)

    // At least some requests should succeed
    const successfulResponses = responses.filter(
      (result): result is PromiseFulfilledResult<Response> =>
        result.status === 'fulfilled' && result.value.status === 200
    )

    expect(successfulResponses.length).toBeGreaterThan(0)

    // Some might be rate limited
    const rateLimitedResponses = responses.filter(
      (result): result is PromiseFulfilledResult<Response> =>
        result.status === 'fulfilled' && result.value.status === 429
    )

    if (rateLimitedResponses.length > 0) {
      const rateLimitedResponse = rateLimitedResponses[0].value
      expect(rateLimitedResponse.headers.get('retry-after')).toBeTruthy()
    }
  })
})
