# File Upload Endpoint

Upload files for processing with secure presigned URLs and progress tracking.

## Endpoint

```
POST /api/v1/upload/sign
```

## Description

The file upload endpoint provides a secure way to upload files to Parsify for processing. It uses presigned URLs to enable direct uploads to cloud storage while maintaining security and providing detailed tracking.

## Upload Flow

1. **Request Upload URL**: Get a presigned URL for your file
2. **Upload File**: Upload directly to cloud storage using the presigned URL
3. **Confirm Upload**: Notify the API that the upload is complete
4. **Process File**: Use the file ID in other API endpoints

## Request Parameters

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filename` | string | Yes | The name of the file to upload |
| `content_type` | string | Yes | MIME type of the file |
| `size` | number | Yes | File size in bytes |

### Supported Content Types

| MIME Type | Description | Max Size |
|-----------|-------------|----------|
| `application/json` | JSON files | 10MB (Free), 50MB (Pro), 500MB (Enterprise) |
| `text/csv` | CSV files | 10MB (Free), 50MB (Pro), 500MB (Enterprise) |
| `application/xml` | XML files | 10MB (Free), 50MB (Pro), 500MB (Enterprise) |
| `text/xml` | XML files (alternative) | 10MB (Free), 50MB (Pro), 500MB (Enterprise) |
| `text/plain` | Plain text files | 10MB (Free), 50MB (Pro), 500MB (Enterprise) |

### Example Request Body

```json
{
  "filename": "data.json",
  "content_type": "application/json",
  "size": 1024000
}
```

## Response

### Success Response (200 OK)

```json
{
  "upload_url": "https://mock-r2-upload.example.com/uploads/uuid-here/data.json",
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "expires_at": 1701388800,
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "AWS4-HMAC-SHA256 Credential=mock/20231201/us-east-1/s3/aws4_request,SignedHeaders=content-type;host;x-amz-date,Signature=mock-signature-uuid",
    "X-Amz-Date": "20231201T120000Z",
    "X-Amz-Expires": "3600"
  }
}
```

### Error Response (400 Bad Request)

```json
{
  "error": "Missing required parameter: filename",
  "message": "The filename parameter is required",
  "requestId": "uuid-here",
  "timestamp": "2023-12-01T12:00:00Z"
}
```

### File Size Error (413 Payload Too Large)

```json
{
  "error": "File size 10485760 bytes exceeds maximum allowed size of 1048576 bytes",
  "message": "File too large for your subscription tier",
  "requestId": "uuid-here",
  "timestamp": "2023-12-01T12:00:00Z"
}
```

## Usage Examples

### JavaScript (Browser and Node.js)

```javascript
class FileUploader {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.baseURL = 'https://api.parsify.dev/api/v1';
  }

  async uploadFile(file, onProgress = null) {
    try {
      // Step 1: Get presigned URL
      const uploadInfo = await this.getUploadURL(file.name, file.type, file.size);
      
      // Step 2: Upload file to cloud storage
      await this.uploadToCloud(uploadInfo.upload_url, file, uploadInfo.headers, onProgress);
      
      // Step 3: Confirm upload
      const confirmation = await this.confirmUpload(uploadInfo.file_id);
      
      return {
        fileId: uploadInfo.file_id,
        filename: file.name,
        size: file.size,
        status: confirmation.status
      };
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async getUploadURL(filename, contentType, size) {
    const response = await fetch(`${this.baseURL}/upload/sign`, {
      method: 'POST',
      headers: {
        'Authorization': this.apiToken ? `Bearer ${this.apiToken}` : undefined,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename,
        content_type: contentType,
        size
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get upload URL');
    }

    return response.json();
  }

  async uploadToCloud(uploadURL, file, headers, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('PUT', uploadURL, true);
      
      // Set required headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Track progress
      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete, event.loaded, event.total);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

      xhr.send(file);
    });
  }

  async confirmUpload(fileId, checksum = null) {
    const response = await fetch(`${this.baseURL}/upload/confirm/${fileId}`, {
      method: 'POST',
      headers: {
        'Authorization': this.apiToken ? `Bearer ${this.apiToken}` : undefined,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ checksum })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to confirm upload');
    }

    return response.json();
  }

  async getUploadStatus(fileId) {
    const response = await fetch(`${this.baseURL}/upload/status/${fileId}`, {
      headers: {
        'Authorization': this.apiToken ? `Bearer ${this.apiToken}` : undefined
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get upload status');
    }

    return response.json();
  }
}

// Browser usage
const uploader = new FileUploader(); // No token needed for basic uploads

document.getElementById('file-input').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const progressBar = document.getElementById('progress-bar');
    
    const result = await uploader.uploadFile(file, (percent, loaded, total) => {
      progressBar.style.width = `${percent}%`;
      console.log(`Upload progress: ${percent.toFixed(2)}%`);
    });

    console.log('Upload completed:', result);
    alert('File uploaded successfully!');
  } catch (error) {
    console.error('Upload failed:', error);
    alert(`Upload failed: ${error.message}`);
  }
});

// Node.js usage
const fs = require('fs');
const path = require('path');

async function uploadFileFromNode(filePath) {
  const uploader = new FileUploader(process.env.PARSIFY_API_TOKEN);
  
  const stats = fs.statSync(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const contentType = getContentType(filename);

  // Create a file-like object for Node.js
  const file = new Blob([fileBuffer], { type: contentType });
  Object.defineProperty(file, 'name', { value: filename });

  try {
    const result = await uploader.uploadFile(file, (percent) => {
      console.log(`Upload progress: ${percent.toFixed(2)}%`);
    });

    console.log('Upload completed:', result);
    return result;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.json': 'application/json',
    '.csv': 'text/csv',
    '.xml': 'application/xml',
    '.txt': 'text/plain'
  };
  return types[ext] || 'text/plain';
}
```

### Python

```python
import requests
import os
import hashlib
from urllib.parse import urlparse

class FileUploader:
    def __init__(self, api_token=None):
        self.api_token = api_token
        self.base_url = "https://api.parsify.dev/api/v1"
        self.session = requests.Session()
        
        if api_token:
            self.session.headers.update({
                'Authorization': f'Bearer {api_token}'
            })

    def upload_file(self, file_path, chunk_size=8192):
        """Upload a file with progress tracking"""
        
        # Get file info
        file_size = os.path.getsize(file_path)
        filename = os.path.basename(file_path)
        content_type = self._get_content_type(filename)
        
        try:
            # Step 1: Get presigned URL
            upload_info = self.get_upload_url(filename, content_type, file_size)
            
            # Step 2: Upload file with progress
            self._upload_to_cloud(
                upload_info['upload_url'], 
                file_path, 
                upload_info['headers'],
                chunk_size
            )
            
            # Step 3: Confirm upload
            confirmation = self.confirm_upload(upload_info['file_id'])
            
            return {
                'file_id': upload_info['file_id'],
                'filename': filename,
                'size': file_size,
                'status': confirmation['status']
            }
            
        except Exception as error:
            raise Exception(f"Upload failed: {str(error)}")

    def get_upload_url(self, filename, content_type, size):
        """Get presigned upload URL"""
        
        response = self.session.post(
            f"{self.base_url}/upload/sign",
            json={
                'filename': filename,
                'content_type': content_type,
                'size': size
            }
        )
        
        response.raise_for_status()
        return response.json()

    def _upload_to_cloud(self, upload_url, file_path, headers, chunk_size):
        """Upload file to cloud storage with progress"""
        
        file_size = os.path.getsize(file_path)
        uploaded = 0
        
        with open(file_path, 'rb') as file:
            # Prepare headers
            upload_headers = {
                'Content-Type': headers['Content-Type'],
                'Authorization': headers['Authorization'],
                'X-Amz-Date': headers['X-Amz-Date'],
                'X-Amz-Expires': headers['X-Amz-Expires']
            }
            
            with requests.Session() as session:
                # Use streaming upload for large files
                with open(file_path, 'rb') as f:
                    response = session.put(
                        upload_url,
                        data=f,
                        headers=upload_headers
                    )
                    response.raise_for_status()

    def confirm_upload(self, file_id, checksum=None):
        """Confirm file upload completion"""
        
        response = self.session.post(
            f"{self.base_url}/upload/confirm/{file_id}",
            json={'checksum': checksum}
        )
        
        response.raise_for_status()
        return response.json()

    def get_upload_status(self, file_id):
        """Get upload status"""
        
        response = self.session.get(f"{self.base_url}/upload/status/{file_id}")
        response.raise_for_status()
        return response.json()

    def _get_content_type(self, filename):
        """Determine content type from file extension"""
        
        ext = os.path.splitext(filename)[1].lower()
        types = {
            '.json': 'application/json',
            '.csv': 'text/csv',
            '.xml': 'application/xml',
            '.txt': 'text/plain'
        }
        return types.get(ext, 'text/plain')

    def calculate_checksum(self, file_path):
        """Calculate SHA-256 checksum of file"""
        
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            # Read and update hash in chunks
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        
        return sha256_hash.hexdigest()

# Usage examples
def upload_example():
    uploader = FileUploader(api_token="your_token_here")
    
    try:
        result = uploader.upload_file("data.json")
        print(f"Upload completed: {result}")
        return result['file_id']
        
    except Exception as error:
        print(f"Upload failed: {error}")
        return None

# Upload with checksum verification
def upload_with_verification(file_path):
    uploader = FileUploader()
    
    # Calculate checksum before upload
    checksum = uploader.calculate_checksum(file_path)
    
    result = uploader.upload_file(file_path)
    
    # You can store the checksum for later verification
    print(f"File uploaded with checksum: {checksum}")
    print(f"File ID: {result['file_id']}")
    
    return result
```

### cURL

```bash
#!/bin/bash

# Step 1: Get presigned upload URL
UPLOAD_RESPONSE=$(curl -s -X POST https://api.parsify.dev/api/v1/upload/sign \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "data.json",
    "content_type": "application/json",
    "size": 1024
  }')

echo "Upload response: $UPLOAD_RESPONSE"

# Extract upload URL and file ID using jq (or manually parse)
UPLOAD_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.upload_url')
FILE_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.file_id')
AUTH_HEADER=$(echo "$UPLOAD_RESPONSE" | jq -r '.headers.Authorization')
X_AMZ_DATE=$(echo "$UPLOAD_RESPONSE" | jq -r '.headers["X-Amz-Date"]')
X_AMZ_EXPIRES=$(echo "$UPLOAD_RESPONSE" | jq -r '.headers["X-Amz-Expires"]')

echo "Uploading to: $UPLOAD_URL"
echo "File ID: $FILE_ID"

# Step 2: Upload the file
echo '{"name":"test","value":123}' > data.json

UPLOAD_RESULT=$(curl -s -X PUT "$UPLOAD_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_HEADER" \
  -H "X-Amz-Date: $X_AMZ_DATE" \
  -H "X-Amz-Expires: $X_AMZ_EXPIRES" \
  --data-binary @data.json)

echo "Upload result: $UPLOAD_RESULT"

# Step 3: Confirm the upload
CONFIRM_RESPONSE=$(curl -s -X POST "https://api.parsify.dev/api/v1/upload/confirm/$FILE_ID" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Confirmation response: $CONFIRM_RESPONSE"

# Step 4: Check upload status
STATUS_RESPONSE=$(curl -s "https://api.parsify.dev/api/v1/upload/status/$FILE_ID")
echo "Upload status: $STATUS_RESPONSE"
```

## Advanced Features

### Chunked Upload for Large Files

```javascript
class ChunkedUploader extends FileUploader {
  async uploadLargeFile(file, chunkSize = 5 * 1024 * 1024) { // 5MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    const chunks = [];
    
    // Split file into chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      chunks.push({ index: i, data: chunk, start, end });
    }
    
    // Upload chunks in parallel (with concurrency limit)
    const concurrencyLimit = 3;
    const results = [];
    
    for (let i = 0; i < chunks.length; i += concurrencyLimit) {
      const batch = chunks.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(chunk => 
        this.uploadChunk(chunk, file.name, file.size, totalChunks)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Report progress
      const progress = ((i + batch.length) / totalChunks) * 100;
      console.log(`Upload progress: ${progress.toFixed(2)}%`);
    }
    
    return {
      fileId: results[0].fileId,
      filename: file.name,
      size: file.size,
      chunks: totalChunks,
      status: 'completed'
    };
  }
  
  async uploadChunk(chunk, filename, totalSize, totalChunks) {
    // Implementation for chunked upload
    // This would require multipart upload support from the API
    throw new Error('Chunked upload not yet implemented');
  }
}
```

### Upload Progress and Resumption

```python
class ResumableUploader(FileUploader):
    def __init__(self, api_token=None, checkpoint_file='.upload_checkpoint'):
        super().__init__(api_token)
        self.checkpoint_file = checkpoint_file
    
    def upload_file_with_resume(self, file_path):
        """Upload file with resume capability"""
        
        # Check for existing checkpoint
        checkpoint = self._load_checkpoint(file_path)
        
        if checkpoint:
            print(f"Resuming upload from checkpoint: {checkpoint['uploaded_bytes']} bytes")
            return self._resume_upload(file_path, checkpoint)
        else:
            return self._fresh_upload(file_path)
    
    def _save_checkpoint(self, file_path, uploaded_bytes, file_id):
        """Save upload progress to checkpoint file"""
        checkpoint = {
            'file_path': file_path,
            'uploaded_bytes': uploaded_bytes,
            'file_id': file_id,
            'timestamp': time.time()
        }
        
        with open(self.checkpoint_file, 'w') as f:
            json.dump(checkpoint, f)
    
    def _load_checkpoint(self, file_path):
        """Load checkpoint if it exists and matches the file"""
        
        if not os.path.exists(self.checkpoint_file):
            return None
        
        try:
            with open(self.checkpoint_file, 'r') as f:
                checkpoint = json.load(f)
            
            # Verify checkpoint is for the same file
            if checkpoint.get('file_path') == file_path:
                current_size = os.path.getsize(file_path)
                if checkpoint.get('uploaded_bytes', 0) < current_size:
                    return checkpoint
        except:
            pass
        
        return None
    
    def _cleanup_checkpoint(self):
        """Remove checkpoint file after successful upload"""
        if os.path.exists(self.checkpoint_file):
            os.remove(self.checkpoint_file)
```

## File Processing After Upload

Once you have a `file_id`, you can use it with other API endpoints:

```javascript
// Use uploaded file in a job
async function processUploadedFile(fileId) {
  const response = await fetch('https://api.parsify.dev/api/v1/jobs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PARSIFY_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tool_id: 'json-format',
      input_ref: fileId  // Reference to uploaded file
    })
  });
  
  return response.json();
}

// Example usage
const uploadResult = await uploader.uploadFile(file);
const job = await processUploadedFile(uploadResult.fileId);
console.log('Job created:', job.id);
```

## Rate Limits

| Subscription | Uploads/Hour | Max File Size |
|--------------|--------------|---------------|
| Anonymous | 5 | 10MB |
| Free | 50 | 10MB |
| Pro | 250 | 50MB |
| Enterprise | 2,500 | 500MB |

## Security Considerations

1. **File Type Validation**: Only allowed MIME types are accepted
2. **Size Limits**: Strict size limits prevent abuse
3. **Virus Scanning**: Files are scanned for malware (Enterprise tier)
4. **Temporary Storage**: Files are automatically cleaned up after expiration
5. **Access Control**: Files can only be accessed by the uploader

## Error Handling

### Common Error Scenarios

```javascript
async function handleUploadErrors(file) {
  try {
    const result = await uploader.uploadFile(file);
    return { success: true, result };
  } catch (error) {
    if (error.message.includes('File size')) {
      return { 
        success: false, 
        error: 'File too large', 
        suggestion: 'Upgrade your subscription for larger file limits' 
      };
    } else if (error.message.includes('Content type')) {
      return { 
        success: false, 
        error: 'Unsupported file type', 
        suggestion: 'Use JSON, CSV, XML, or plain text files' 
      };
    } else if (error.message.includes('Missing required parameter')) {
      return { 
        success: false, 
        error: 'Invalid request', 
        suggestion: 'Check file information and try again' 
      };
    } else {
      return { 
        success: false, 
        error: 'Upload failed', 
        suggestion: 'Please try again later' 
      };
    }
  }
}
```

## Related Endpoints

- [File Status](./file-status.md) - Check upload status and file information
- [Jobs API](./jobs-create.md) - Process uploaded files with various tools
- [JSON Formatter](./json-formatter.md) - Format uploaded JSON files
- [JSON Converter](./json-converter.md) - Convert uploaded files to other formats