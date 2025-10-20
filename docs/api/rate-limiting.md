# Rate Limiting & Usage Quotas

This guide covers rate limiting, quotas, and usage limits for the Parsify API to help you build applications that work within the limits and provide great user experiences.

## Overview

The Parsify API implements rate limiting to ensure fair usage, prevent abuse, and maintain service quality for all users. Rate limits vary based on:

- **Authentication status** (anonymous vs authenticated users)
- **Subscription tier** (Free, Pro, Enterprise)
- **Endpoint type** (tools, uploads, jobs, etc.)
- **Request complexity** (file size, execution time, etc.)

## Rate Limiting Strategies

### Token Bucket Algorithm

The API primarily uses the token bucket algorithm for rate limiting:

- **Buckets are refilled** at a constant rate
- **Tokens are consumed** for each request
- **Requests are allowed** when enough tokens are available
- **Requests are rejected** when the bucket is empty

### Rate Limit Headers

Every API response includes rate limit headers:

```
X-Rate-Limit-Limit: 1000
X-Rate-Limit-Remaining: 999
X-Rate-Limit-Reset: 1701388800
X-Rate-Limit-Strategy: token_bucket
X-Rate-Limit-Retry-After: 60  # Only when rate limited
```

## Subscription Tiers and Limits

### Anonymous Users

| Category | Limit | Time Window |
|----------|-------|-------------|
| API Requests | 100 | Hour |
| File Uploads | 5 | Hour |
| Jobs | 2 | Hour |
| Max File Size | 10MB | Per Request |
| Max Execution Time | 1 second | Per Request |

### Free Tier

| Category | Limit | Time Window |
|----------|-------|-------------|
| API Requests | 1,000 | Hour |
| File Uploads | 50 | Hour |
| Jobs | 20 | Hour |
| Max File Size | 10MB | Per Request |
| Max Execution Time | 5 seconds | Per Request |

### Pro Tier

| Category | Limit | Time Window |
|----------|-------|-------------|
| API Requests | 5,000 | Hour |
| File Uploads | 250 | Hour |
| Jobs | 100 | Hour |
| Max File Size | 50MB | Per Request |
| Max Execution Time | 15 seconds | Per Request |

### Enterprise Tier

| Category | Limit | Time Window |
|----------|-------|-------------|
| API Requests | 50,000 | Hour |
| File Uploads | 2,500 | Hour |
| Jobs | 1,000 | Hour |
| Max File Size | 500MB | Per Request |
| Max Execution Time | 60 seconds | Per Request |

## Endpoint-Specific Limits

### Tools Endpoints

#### JSON Tools (Format, Validate, Convert)

| Tier | Requests/Hour | Max Input Size | Max Execution Time |
|------|---------------|----------------|-------------------|
| Anonymous | 100 | 10MB | 1 second |
| Free | 1,000 | 10MB | 1 second |
| Pro | 5,000 | 50MB | 5 seconds |
| Enterprise | 50,000 | 500MB | 30 seconds |

#### Code Tools (Execute, Format)

| Tier | Requests/Hour | Max Input Size | Max Execution Time |
|------|---------------|----------------|-------------------|
| Anonymous | 0 (not available) | - | - |
| Free | 100 (JS only) | 1MB | 5 seconds |
| Pro | 1,000 | 5MB | 15 seconds |
| Enterprise | 10,000 | 10MB | 60 seconds |

### File Upload Endpoints

| Tier | Uploads/Hour | Max File Size | Storage Duration |
|------|--------------|---------------|------------------|
| Anonymous | 5 | 10MB | 1 hour |
| Free | 50 | 10MB | 24 hours |
| Pro | 250 | 50MB | 7 days |
| Enterprise | 2,500 | 500MB | 30 days |

### Job Processing Endpoints

| Tier | Jobs/Hour | Max Concurrent Jobs | Max Job Duration |
|------|-----------|---------------------|------------------|
| Anonymous | 2 | 1 | 5 minutes |
| Free | 20 | 5 | 30 minutes |
| Pro | 100 | 20 | 2 hours |
| Enterprise | 1,000 | 100 | 24 hours |

## Rate Limit Response Format

When you exceed a rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Please try again later.",
  "requestId": "uuid-here",
  "timestamp": "2023-12-01T12:00:00Z",
  "retryAfter": 300,
  "limit": 1000,
  "remaining": 0,
  "resetTime": 1701388800,
  "strategy": "token_bucket"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `error` | string | Error type identifier |
| `message` | string | Human-readable error message |
| `retryAfter` | number | Seconds to wait before retrying |
| `limit` | number | Total request limit for the window |
| `remaining` | number | Remaining requests in the window |
| `resetTime` | number | Unix timestamp when the window resets |
| `strategy` | string | Rate limiting algorithm used |

## Best Practices for Rate Limiting

### 1. Monitor Rate Limit Headers

```javascript
class RateLimitTracker {
  constructor() {
    this.limits = {};
  }

  updateFromResponse(response) {
    const headers = {
      limit: response.headers.get('X-Rate-Limit-Limit'),
      remaining: response.headers.get('X-Rate-Limit-Remaining'),
      reset: response.headers.get('X-Rate-Limit-Reset'),
      retryAfter: response.headers.get('X-Rate-Limit-Retry-After')
    };

    const endpoint = this.getEndpointFromURL(response.url);
    
    this.limits[endpoint] = {
      limit: parseInt(headers.limit),
      remaining: parseInt(headers.remaining),
      reset: parseInt(headers.reset),
      retryAfter: parseInt(headers.retryAfter),
      lastUpdate: Date.now()
    };

    this.logStatus(endpoint);
  }

  getEndpointFromURL(url) {
    // Extract endpoint type from URL
    if (url.includes('/tools/')) return 'tools';
    if (url.includes('/upload/')) return 'upload';
    if (url.includes('/jobs/')) return 'jobs';
    return 'api';
  }

  logStatus(endpoint) {
    const limit = this.limits[endpoint];
    if (!limit) return;

    const usagePercent = ((limit.limit - limit.remaining) / limit.limit) * 100;
    
    console.log(`Rate Limit Status [${endpoint}]:`);
    console.log(`  Usage: ${limit.limit - limit.remaining}/${limit.limit} (${usagePercent.toFixed(1)}%)`);
    console.log(`  Remaining: ${limit.remaining}`);
    console.log(`  Reset: ${new Date(limit.reset * 1000).toLocaleString()}`);
    
    if (usagePercent > 80) {
      console.warn(`⚠️  High usage detected: ${usagePercent.toFixed(1)}%`);
    }
  }

  shouldThrottle(endpoint) {
    const limit = this.limits[endpoint];
    if (!limit) return false;
    
    const usagePercent = ((limit.limit - limit.remaining) / limit.limit) * 100;
    return usagePercent > 90; // Throttle at 90% usage
  }

  getRetryDelay(endpoint) {
    const limit = this.limits[endpoint];
    if (!limit || !limit.retryAfter) return null;
    
    return limit.retryAfter * 1000; // Convert to milliseconds
  }
}
```

### 2. Implement Exponential Backoff

```javascript
class APIClient {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.rateTracker = new RateLimitTracker();
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000
    };
  }

  async requestWithRetry(url, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(url, options);
        this.rateTracker.updateFromResponse(response);
        return response;
      } catch (error) {
        lastError = error;
        
        if (error.status === 429) {
          // Rate limit error - use retry-after or exponential backoff
          const delay = this.calculateRetryDelay(error, attempt);
          console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt})`);
          await this.sleep(delay);
          continue;
        }
        
        if (error.status >= 500 && attempt < this.retryConfig.maxRetries) {
          // Server error - retry with exponential backoff
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
            this.retryConfig.maxDelay
          );
          console.log(`Server error, retrying in ${delay}ms (attempt ${attempt})`);
          await this.sleep(delay);
          continue;
        }
        
        // Non-retryable error
        throw error;
      }
    }
    
    throw lastError;
  }

  calculateRetryDelay(error, attempt) {
    // Use retry-after header if available
    if (error.retryAfter) {
      return error.retryAfter * 1000;
    }
    
    // Otherwise use exponential backoff with jitter
    const baseDelay = this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
    return Math.min(baseDelay + jitter, this.retryConfig.maxDelay);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(url, options = {}) {
    const response = await fetch(url, {
      headers: {
        'Authorization': this.apiToken ? `Bearer ${this.apiToken}` : undefined,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || 'Request failed');
      error.status = response.status;
      error.retryAfter = errorData.retryAfter;
      throw error;
    }

    return response;
  }
}
```

### 3. Request Queuing and Throttling

```javascript
class RequestQueue {
  constructor(maxConcurrent = 5, rateLimitPerSecond = 10) {
    this.maxConcurrent = maxConcurrent;
    this.rateLimitPerSecond = rateLimitPerSecond;
    this.queue = [];
    this.running = 0;
    this.lastRequestTime = 0;
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn: requestFn,
        resolve,
        reject,
        timestamp: Date.now()
      });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.maxConcurrent) {
      return;
    }

    if (this.queue.length === 0) {
      return;
    }

    // Rate limiting: wait if we're making too many requests per second
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / this.rateLimitPerSecond;
    
    if (timeSinceLastRequest < minInterval) {
      setTimeout(() => this.process(), minInterval - timeSinceLastRequest);
      return;
    }

    const request = this.queue.shift();
    this.running++;
    this.lastRequestTime = now;

    try {
      const result = await request.fn();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.running--;
      // Process next request
      setImmediate(() => this.process());
    }
  }

  getStats() {
    return {
      queued: this.queue.length,
      running: this.running,
      maxConcurrent: this.maxConcurrent,
      rateLimitPerSecond: this.rateLimitPerSecond
    };
  }
}

// Usage example
const apiClient = new APIClient(process.env.PARSIFY_API_TOKEN);
const requestQueue = new RequestQueue(3, 10); // 3 concurrent, 10 per second

// Queue multiple requests
const requests = [
  () => apiClient.requestWithRetry('/tools/json/format', {
    method: 'POST',
    body: JSON.stringify({ json: '{"test": 1}', indent: 2 })
  }),
  () => apiClient.requestWithRetry('/tools/json/validate', {
    method: 'POST',
    body: JSON.stringify({ json: '{"test": 1}' })
  }),
  // ... more requests
];

const results = await Promise.all(
  requests.map(req => requestQueue.add(req))
);
```

### 4. Client-Side Caching

```javascript
class APICache {
  constructor(maxSize = 100, defaultTTL = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Cache-aware API client
class CachedAPIClient extends APIClient {
  constructor(apiToken, cacheOptions = {}) {
    super(apiToken);
    this.cache = new APICache(cacheOptions.maxSize, cacheOptions.defaultTTL);
    
    // Cleanup cache every 5 minutes
    setInterval(() => this.cache.cleanup(), 300000);
  }

  async getCachedRequest(url, options = {}, cacheTTL) {
    const cacheKey = this.getCacheKey(url, options);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${url}`);
      return cached;
    }

    console.log(`Cache miss for ${url}, making request`);
    
    // Make request and cache result
    const response = await this.requestWithRetry(url, options);
    
    // Cache successful responses
    if (response.ok) {
      this.cache.set(cacheKey, response, cacheTTL);
    }

    return response;
  }

  getCacheKey(url, options) {
    // Create a cache key from URL and relevant options
    const keyData = {
      url,
      method: options.method || 'GET',
      body: options.body ? JSON.parse(options.body) : null
    };
    
    return btoa(JSON.stringify(keyData));
  }
}
```

## Usage Monitoring

### Real-time Monitoring Dashboard

```javascript
class UsageMonitor {
  constructor() {
    this.stats = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        rateLimited: 0
      },
      endpoints: {},
      hourlyUsage: new Array(24).fill(0),
      lastReset = Date.now()
    };
  }

  recordRequest(endpoint, status, responseTime) {
    const now = Date.now();
    const hour = new Date(now).getHours();
    
    // Update overall stats
    this.stats.requests.total++;
    
    if (status >= 200 && status < 300) {
      this.stats.requests.successful++;
    } else if (status === 429) {
      this.stats.requests.rateLimited++;
    } else {
      this.stats.requests.failed++;
    }
    
    // Update endpoint stats
    if (!this.stats.endpoints[endpoint]) {
      this.stats.endpoints[endpoint] = {
        count: 0,
        avgResponseTime: 0,
        errors: 0
      };
    }
    
    const endpointStats = this.stats.endpoints[endpoint];
    endpointStats.count++;
    endpointStats.avgResponseTime = 
      (endpointStats.avgResponseTime * (endpointStats.count - 1) + responseTime) / endpointStats.count;
    
    if (status >= 400) {
      endpointStats.errors++;
    }
    
    // Update hourly usage
    this.stats.hourlyUsage[hour]++;
  }

  getUsageReport() {
    const total = this.stats.requests.total;
    const successRate = total > 0 ? (this.stats.requests.successful / total) * 100 : 0;
    const errorRate = total > 0 ? (this.stats.requests.failed / total) * 100 : 0;
    const rateLimitRate = total > 0 ? (this.stats.requests.rateLimited / total) * 100 : 0;
    
    return {
      summary: {
        totalRequests: total,
        successRate: successRate.toFixed(2) + '%',
        errorRate: errorRate.toFixed(2) + '%',
        rateLimitRate: rateLimitRate.toFixed(2) + '%'
      },
      endpoints: this.stats.endpoints,
      hourlyUsage: this.stats.hourlyUsage,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    const stats = this.stats;
    
    // Check error rate
    const errorRate = stats.requests.failed / stats.requests.total;
    if (errorRate > 0.1) { // 10% error rate
      recommendations.push({
        type: 'error_rate',
        message: 'High error rate detected. Check request format and error handling.',
        priority: 'high'
      });
    }
    
    // Check rate limiting
    const rateLimitRate = stats.requests.rateLimited / stats.requests.total;
    if (rateLimitRate > 0.05) { // 5% rate limit rate
      recommendations.push({
        type: 'rate_limiting',
        message: 'Frequent rate limiting. Consider implementing better caching or request throttling.',
        priority: 'medium'
      });
    }
    
    // Check slow endpoints
    Object.entries(stats.endpoints).forEach(([endpoint, data]) => {
      if (data.avgResponseTime > 5000) { // 5 seconds
        recommendations.push({
          type: 'performance',
          message: `${endpoint} is slow (avg: ${data.avgResponseTime}ms). Consider optimization.`,
          priority: 'low'
        });
      }
    });
    
    return recommendations;
  }
}
```

### Python Usage Monitoring

```python
import time
import json
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class UsageTracker:
    def __init__(self, max_history=1000):
        self.max_history = max_history
        self.requests = deque(maxlen=max_history)
        self.endpoints = defaultdict(lambda: {
            'count': 0,
            'errors': 0,
            'total_time': 0,
            'rate_limits': 0
        })
        self.hourly_stats = defaultdict(int)
        self.start_time = time.time()

    def record_request(self, endpoint: str, status_code: int, response_time: float):
        timestamp = time.time()
        hour_key = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:00')
        
        # Record request
        self.requests.append({
            'timestamp': timestamp,
            'endpoint': endpoint,
            'status_code': status_code,
            'response_time': response_time
        })
        
        # Update endpoint stats
        stats = self.endpoints[endpoint]
        stats['count'] += 1
        stats['total_time'] += response_time
        
        if status_code >= 400:
            stats['errors'] += 1
        
        if status_code == 429:
            stats['rate_limits'] += 1
        
        # Update hourly stats
        self.hourly_stats[hour_key] += 1

    def get_usage_summary(self) -> Dict:
        total_requests = len(self.requests)
        if total_requests == 0:
            return {'message': 'No requests recorded'}
        
        # Calculate rates
        time_elapsed = time.time() - self.start_time
        requests_per_minute = (total_requests / time_elapsed) * 60
        
        # Calculate error rates
        total_errors = sum(stats['errors'] for stats in self.endpoints.values())
        error_rate = (total_errors / total_requests) * 100
        
        # Calculate rate limit rate
        total_rate_limits = sum(stats['rate_limits'] for stats in self.endpoints.values())
        rate_limit_rate = (total_rate_limits / total_requests) * 100
        
        return {
            'total_requests': total_requests,
            'requests_per_minute': round(requests_per_minute, 2),
            'error_rate': round(error_rate, 2),
            'rate_limit_rate': round(rate_limit_rate, 2),
            'uptime_seconds': int(time_elapsed),
            'endpoints': dict(self.endpoints),
            'recent_activity': list(self.requests)[-10:],  # Last 10 requests
            'hourly_breakdown': dict(self.hourly_stats)
        }

    def get_endpoint_performance(self, endpoint: str) -> Optional[Dict]:
        if endpoint not in self.endpoints:
            return None
        
        stats = self.endpoints[endpoint]
        if stats['count'] == 0:
            return None
        
        return {
            'endpoint': endpoint,
            'total_requests': stats['count'],
            'average_response_time': round(stats['total_time'] / stats['count'], 2),
            'error_rate': round((stats['errors'] / stats['count']) * 100, 2),
            'rate_limit_rate': round((stats['rate_limits'] / stats['count']) * 100, 2)
        }

# Integration with API client
class MonitoredParsifyClient(ParsifyClient):
    def __init__(self, api_token: Optional[str] = None):
        super().__init__(api_token)
        self.usage_tracker = UsageTracker()

    def make_request(self, method: str, endpoint: str, **kwargs):
        start_time = time.time()
        
        try:
            result = super().make_request(method, endpoint, **kwargs)
            response_time = (time.time() - start_time) * 1000  # Convert to ms
            self.usage_tracker.record_request(endpoint, 200, response_time)
            return result
        except ParsifyAPIError as error:
            response_time = (time.time() - start_time) * 1000
            self.usage_tracker.record_request(endpoint, error.status, response_time)
            raise
        except Exception as error:
            response_time = (time.time() - start_time) * 1000
            self.usage_tracker.record_request(endpoint, 500, response_time)
            raise

    def get_usage_report(self):
        return self.usage_tracker.get_usage_summary()

    def get_performance_report(self):
        return {
            endpoint: self.usage_tracker.get_endpoint_performance(endpoint)
            for endpoint in self.usage_tracker.endpoints.keys()
        }
```

## Handling Rate Limits Gracefully

### Progressive Degradation

```javascript
class AdaptiveAPIClient extends APIClient {
  constructor(apiToken) {
    super(apiToken);
    this.performanceMode = 'normal'; // normal, throttled, degraded
    this.lastRateLimitTime = 0;
  }

  async adaptiveRequest(url, options = {}) {
    // Adjust behavior based on recent rate limits
    const timeSinceLastRateLimit = Date.now() - this.lastRateLimitTime;
    
    if (timeSinceLastRateLimit < 60000) { // Within 1 minute of rate limit
      this.performanceMode = 'degraded';
      console.log('Operating in degraded mode due to recent rate limiting');
    } else if (timeSinceLastRateLimit < 300000) { // Within 5 minutes
      this.performanceMode = 'throttled';
    } else {
      this.performanceMode = 'normal';
    }

    // Apply adaptive strategies
    switch (this.performanceMode) {
      case 'degraded':
        return this.makeDegradedRequest(url, options);
      case 'throttled':
        return this.makeThrottledRequest(url, options);
      default:
        return this.requestWithRetry(url, options);
    }
  }

  async makeDegradedRequest(url, options) {
    // Use cached responses if available
    if (this.cache && this.cache.has(url)) {
      console.log('Using cached response due to degraded mode');
      return this.cache.get(url);
    }

    // Add significant delay between requests
    await this.sleep(2000); // 2 second delay
    
    try {
      const response = await this.requestWithRetry(url, options);
      
      // Cache successful responses for longer in degraded mode
      if (this.cache && response.ok) {
        this.cache.set(url, response, 600000); // 10 minutes
      }
      
      return response;
    } catch (error) {
      if (error.status === 429) {
        this.lastRateLimitTime = Date.now();
        
        // Return fallback response if available
        return this.getFallbackResponse(url, options);
      }
      throw error;
    }
  }

  async makeThrottledRequest(url, options) {
    // Add moderate delay between requests
    await this.sleep(500); // 500ms delay
    
    try {
      return await this.requestWithRetry(url, options);
    } catch (error) {
      if (error.status === 429) {
        this.lastRateLimitTime = Date.now();
      }
      throw error;
    }
  }

  getFallbackResponse(url, options) {
    // Return appropriate fallback based on endpoint
    if (url.includes('/tools/json/format')) {
      return {
        formatted: null,
        valid: false,
        errors: [{ message: 'Service temporarily unavailable due to high demand' }]
      };
    }
    
    return {
      error: 'Service temporarily unavailable',
      message: 'Please try again later',
      fallback: true
    };
  }
}
```

This comprehensive rate limiting guide should help you build applications that work efficiently within the API limits and provide excellent user experiences even when approaching or hitting limits.