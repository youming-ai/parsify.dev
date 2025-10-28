/**
 * Simple Development Server
 *
 * This is a temporary development server that doesn't require Cloudflare Workers
 * for local development and testing.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const PORT = 8787

// Mock data and services
const mockHealthStatus = {
  status: 'ok',
  timestamp: new Date().toISOString(),
  environment: 'development',
  version: 'v1',
  services: {
    database: 'healthy',
    cache: 'healthy',
    storage: 'healthy',
  },
}

const mockTools = [
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format and validate JSON data',
    endpoint: '/api/v1/tools/json/format',
  },
  {
    id: 'code-executor',
    name: 'Code Executor',
    description: 'Execute code in a secure sandbox',
    endpoint: '/api/v1/tools/code/execute',
  },
  {
    id: 'file-converter',
    name: 'File Converter',
    description: 'Convert between different file formats',
    endpoint: '/api/v1/tools/file/convert',
  },
]

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname
  const method = request.method

  console.log(`${method} ${path} - ${new Date().toISOString()}`)

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Route handling
    if (path === '/' && method === 'GET') {
      return new Response(
        JSON.stringify({
          name: 'Parsify API (Development)',
          version: 'v1',
          status: 'operational',
          timestamp: new Date().toISOString(),
          endpoints: {
            health: '/health',
            tools: '/api/v1/tools',
            docs: '/api/v1/docs',
          },
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    if (path === '/health' && method === 'GET') {
      return new Response(JSON.stringify(mockHealthStatus), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (path === '/api/v1/tools' && method === 'GET') {
      return new Response(JSON.stringify({ tools: mockTools }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // JSON formatter endpoint
    if (path === '/api/v1/tools/json/format' && method === 'POST') {
      try {
        const body = await request.json()
        const { json, indent = 2 } = body

        let parsed
        try {
          parsed = typeof json === 'string' ? JSON.parse(json) : json
        } catch (e) {
          return new Response(
            JSON.stringify({
              error: 'Invalid JSON',
              message: e.message,
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          )
        }

        const formatted = JSON.stringify(parsed, null, indent)

        return new Response(
          JSON.stringify({
            success: true,
            result: formatted,
            original: json,
            stats: {
              characters: formatted.length,
              lines: formatted.split('\n').length,
            },
          }),
          {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        )
      } catch (e) {
        return new Response(
          JSON.stringify({
            error: 'Request Error',
            message: e.message,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        )
      }
    }

    // Code executor endpoint (mock)
    if (path === '/api/v1/tools/code/execute' && method === 'POST') {
      try {
        const body = await request.json()
        const { code, language = 'javascript' } = body

        // Simple JavaScript execution (only for development!)
        let result
        try {
          if (language === 'javascript') {
            // Very basic evaluation - DO NOT USE IN PRODUCTION
            const func = new Function(code)
            result = String(func())
          } else {
            result = `Code execution for ${language} not implemented in development mode`
          }
        } catch (e) {
          result = `Error: ${e.message}`
        }

        return new Response(
          JSON.stringify({
            success: true,
            result,
            language,
            executionTime: Math.random() * 100, // Mock execution time
          }),
          {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        )
      } catch (e) {
        return new Response(
          JSON.stringify({
            error: 'Request Error',
            message: e.message,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        )
      }
    }

    // 404 handler
    return new Response(
      JSON.stringify({
        error: 'Not Found',
        message: `The endpoint ${method} ${path} was not found`,
        availableEndpoints: [
          '/',
          '/health',
          '/api/v1/tools',
          '/api/v1/tools/json/format',
          '/api/v1/tools/code/execute',
        ],
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  } catch (error) {
    console.error('Server error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
}

console.log(`🚀 Parsify API Development Server starting on port ${PORT}`)
console.log(`📖 Available endpoints:`)
console.log(`   GET  http://localhost:${PORT}/`)
console.log(`   GET  http://localhost:${PORT}/health`)
console.log(`   GET  http://localhost:${PORT}/api/v1/tools`)
console.log(`   POST http://localhost:${PORT}/api/v1/tools/json/format`)
console.log(`   POST http://localhost:${PORT}/api/v1/tools/code/execute`)
console.log(`\n🔧 Development server with mock services`)

await serve(handleRequest, { port: PORT })
