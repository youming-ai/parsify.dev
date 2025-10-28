import { Hono } from 'hono'
import { v4 as uuidv4 } from 'uuid'

const app = new Hono()

// In-memory file tracking for MVP
// In production, this would use R2 and database
const fileUploads = new Map<string, any>()

// Get presigned URL for file upload
app.post('/sign', async c => {
  try {
    const body = await c.req.json()

    // Validate required parameters
    if (!body.filename) {
      return c.json({ error: 'Missing required parameter: filename' }, 400)
    }
    if (!body.content_type) {
      return c.json({ error: 'Missing required parameter: content_type' }, 400)
    }
    if (!body.size || body.size <= 0) {
      return c.json({ error: 'Missing or invalid parameter: size' }, 400)
    }

    const { filename, content_type, size } = body

    // Validate content type
    const allowedTypes = [
      'application/json',
      'text/csv',
      'application/xml',
      'text/xml',
      'text/plain',
    ]

    if (!allowedTypes.includes(content_type)) {
      return c.json({ error: `Content type ${content_type} is not allowed` }, 400)
    }

    // Validate file size (10MB limit for free users in MVP)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (size > maxSize) {
      return c.json(
        {
          error: `File size ${size} bytes exceeds maximum allowed size of ${maxSize} bytes`,
        },
        413
      ) // Payload Too Large
    }

    // Validate filename
    if (filename.length > 255) {
      return c.json({ error: 'Filename too long (max 255 characters)' }, 400)
    }

    // Check for prohibited file extensions
    const prohibitedExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.com',
      '.pif',
      '.scr',
      '.vbs',
      '.js',
      '.jar',
      '.zip',
      '.tar',
      '.gz',
    ]
    const hasProhibitedExtension = prohibitedExtensions.some(ext =>
      filename.toLowerCase().endsWith(ext)
    )

    if (hasProhibitedExtension) {
      return c.json({ error: 'File type not allowed for security reasons' }, 400)
    }

    const fileId = uuidv4()
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = now + 3600 // 1 hour from now

    // Create file upload record
    const fileUpload = {
      id: fileId,
      user_id: null, // MVP doesn't require authentication
      filename,
      mime_type: content_type,
      size_bytes: size,
      r2_key: `uploads/${fileId}/${filename}`,
      checksum: null, // Would be calculated when file is uploaded
      status: 'uploading',
      expires_at: expiresAt,
      created_at: now,
    }

    fileUploads.set(fileId, fileUpload)

    // Generate mock presigned URL
    // In production, this would use R2's presigned URL functionality
    const uploadUrl = `https://mock-r2-upload.example.com/${fileUpload.r2_key}`

    // Generate mock signature and headers for presigned URL
    const headers = {
      'Content-Type': content_type,
      Authorization: `AWS4-HMAC-SHA256 Credential=mock/20231201/us-east-1/s3/aws4_request,SignedHeaders=content-type;host;x-amz-date,Signature=mock-signature-${fileId}`,
      'X-Amz-Date': `${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}Z`,
      'X-Amz-Expires': '3600',
    }

    return c.json({
      upload_url: uploadUrl,
      file_id: fileId,
      expires_at: expiresAt,
      headers: headers,
    })
  } catch (_error) {
    return c.json({ error: 'Invalid request format' }, 400)
  }
})

// Get upload status
app.get('/status/:fileId', async c => {
  const fileId = c.req.param('fileId')

  // Validate file ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(fileId)) {
    return c.json({ error: 'Invalid file ID format' }, 400)
  }

  const fileUpload = fileUploads.get(fileId)
  if (!fileUpload) {
    return c.json({ error: 'File upload not found' }, 404)
  }

  return c.json({
    file_id: fileId,
    filename: fileUpload.filename,
    status: fileUpload.status,
    size_bytes: fileUpload.size_bytes,
    created_at: fileUpload.created_at,
    expires_at: fileUpload.expires_at,
  })
})

// Confirm file upload completion
app.post('/confirm/:fileId', async c => {
  const fileId = c.req.param('fileId')
  const body = await c.req.json()

  const fileUpload = fileUploads.get(fileId)
  if (!fileUpload) {
    return c.json({ error: 'File upload not found' }, 404)
  }

  // Update file status to completed
  fileUpload.status = 'completed'
  fileUpload.checksum = body.checksum || null
  fileUpload.updated_at = Math.floor(Date.now() / 1000)

  fileUploads.set(fileId, fileUpload)

  return c.json({
    file_id: fileId,
    status: 'completed',
    message: 'File upload confirmed successfully',
  })
})

// Get file download URL (not implemented in MVP)
app.get('/download/:fileId', async c => {
  const fileId = c.req.param('fileId')

  const fileUpload = fileUploads.get(fileId)
  if (!fileUpload) {
    return c.json({ error: 'File not found' }, 404)
  }

  if (fileUpload.status !== 'completed') {
    return c.json({ error: 'File upload not completed' }, 400)
  }

  // Check if file has expired
  const now = Math.floor(Date.now() / 1000)
  if (now > fileUpload.expires_at) {
    return c.json({ error: 'File has expired' }, 410)
  }

  // Mock download URL
  const downloadUrl = `https://mock-r2-download.example.com/${fileUpload.r2_key}`

  return c.json({
    download_url: downloadUrl,
    filename: fileUpload.filename,
    size_bytes: fileUpload.size_bytes,
    content_type: fileUpload.mime_type,
  })
})

// Delete file upload
app.delete('/:fileId', async c => {
  const fileId = c.req.param('fileId')

  const fileUpload = fileUploads.get(fileId)
  if (!fileUpload) {
    return c.json({ error: 'File upload not found' }, 404)
  }

  fileUploads.delete(fileId)

  return c.json({
    message: 'File upload deleted successfully',
  })
})

// List uploads (for admin/debug)
app.get('/', async c => {
  const status = c.req.query('status')
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const offset = parseInt(c.req.query('offset') || '0', 10)

  let allUploads = Array.from(fileUploads.values())

  // Apply filters
  if (status) {
    allUploads = allUploads.filter(upload => upload.status === status)
  }

  // Sort by created_at descending
  allUploads.sort((a, b) => b.created_at - a.created_at)

  // Apply pagination
  const paginatedUploads = allUploads.slice(offset, offset + limit)

  return c.json({
    uploads: paginatedUploads,
    total: allUploads.length,
    limit,
    offset,
  })
})

export { app as upload }
