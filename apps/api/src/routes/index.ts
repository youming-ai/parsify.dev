/**
 * Main API Routes Index
 * Combines all route modules
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { Env } from '../index'

// Import route modules
import { analyticsRoutes } from './analytics'
import { jobs } from './jobs'
import { upload } from './upload'

const app = new Hono<{ Bindings: Env }>()

// Apply middleware to all routes
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://parsify.dev'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
)

app.use('*', logger())

// Health check endpoint
app.get('/health', c => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

// API routes
app.route('/analytics', analyticsRoutes)
app.route('/jobs', jobs)
app.route('/upload', upload)

// Root endpoint
app.get('/', c => {
  return c.json({
    name: 'Parsify API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      analytics: '/analytics',
      jobs: '/jobs',
      upload: '/upload',
    },
  })
})

// 404 handler
app.notFound(c => {
  return c.json(
    {
      error: 'Not Found',
      message: `The requested endpoint ${c.req.path} was not found`,
      availableEndpoints: ['/health', '/analytics', '/jobs', '/upload'],
    },
    404
  )
})

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json(
    {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    },
    500
  )
})

export { app as routes }
