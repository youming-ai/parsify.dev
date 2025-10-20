# Performance Optimization Best Practices

This guide covers performance optimization techniques for integrating with the Parsify API to ensure fast, efficient, and scalable applications.

## Overview

Performance is crucial for providing excellent user experiences and managing costs effectively. This guide covers:

- Request optimization and batching
- Caching strategies
- Connection management
- Error handling and retries
- Monitoring and optimization
- Cost optimization

## Request Optimization

### 1. Minimize Request Payload Size

Reduce the amount of data sent in each request to improve speed and reduce costs.

```javascript
class OptimizedRequestBuilder {
  static buildJSONFormatRequest(jsonString, options = {}) {
    // Remove unnecessary whitespace from input
    const trimmedJSON = jsonString.trim();
    
    // Use reasonable defaults
    const payload = {
      json: trimmedJSON,
      indent: options.indent || 2,
      sort_keys: options.sortKeys || false
    };

    // Remove undefined values
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    return payload;
  }

  static buildCodeExecuteRequest(code, language, options = {}) {
    // Remove comments and whitespace from code (when safe)
    const optimizedCode = this.optimizeCode(code, language);
    
    return {
      code: optimizedCode,
      language,
      input: options.input || '',
      timeout: Math.min(options.timeout || 5000, 10000) // Cap at 10 seconds
    };
  }

  static optimizeCode(code, language) {
    // Remove excessive whitespace and comments
    switch (language) {
      case 'javascript':
        return code
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
          .replace(/\/\/.*$/gm, '') // Remove line comments
          .replace(/\s+/g, ' ') // Collapse whitespace
          .trim();
      
      case 'python':
        return code
          .replace(/#.*$/gm, '') // Remove comments
          .replace(/\s+/g, ' ') // Collapse whitespace
          .trim();
      
      default:
        return code.trim();
    }
  }
}
```

### 2. Request Batching

Combine multiple operations into single requests when possible:

```javascript
class BatchProcessor {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.batchSize = 10;
    this.batchTimeout = 100; // 100ms
    this.pendingRequests = [];
    this.batchTimer = null;
  }

  async addToBatch(request) {
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({
        request,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Trigger batch processing
      this.scheduleBatch();
    });
  }

  scheduleBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Process batch if full or timeout reached
    if (this.pendingRequests.length >= this.batchSize) {
      this.processBatch();
    } else {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchTimeout);
    }
  }

  async processBatch() {
    if (this.pendingRequests.length === 0) return;

    const batch = this.pendingRequests.splice(0, this.batchSize);
    
    try {
      const results = await this.executeBatch(batch);
      this.resolveBatch(batch, results);
    } catch (error) {
      this.rejectBatch(batch, error);
    }
  }

  async executeBatch(batch) {
    // Create batch request
    const operations = batch.map(item => item.request);
    
    const response = await this.apiClient.request('/batch', {
      method: 'POST',
      body: JSON.stringify({ operations })
    });

    return response.results;
  }

  resolveBatch(batch, results) {
    batch.forEach((item, index) => {
      if (results[index] && results[index].success) {
        item.resolve(results[index].data);
      } else {
        item.reject(new Error(results[index]?.error || 'Batch operation failed'));
      }
    });
  }

  rejectBatch(batch, error) {
    batch.forEach(item => {
      item.reject(error);
    });
  }
}

// Usage
const batchProcessor = new BatchProcessor(apiClient);

// These requests will be batched together
const result1 = await batchProcessor.addToBatch({
  endpoint: '/tools/json/format',
  method: 'POST',
  body: { json: '{"test": true}', indent: 2 }
});

const result2 = await batchProcessor.addToBatch({
  endpoint: '/tools/json/validate',
  method: 'POST', 
  body: { json: '{"test": true}' }
});
```

### 3. Parallel Processing

Execute independent requests in parallel:

```javascript
class ParallelProcessor {
  constructor(maxConcurrency = 5) {
    this.maxConcurrency = maxConcurrency;
    this.running = 0;
    this.queue = [];
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn: requestFn,
        resolve,
        reject
      });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      // Process next item in queue
      setImmediate(() => this.process());
    }
  }

  async addAll(requestFns) {
    const promises = requestFns.map(fn => this.add(fn));
    return Promise.all(promises);
  }
}

// Usage
const processor = new ParallelProcessor(3);

// Process multiple JSON formatting requests in parallel
const requests = [
  () => apiClient.formatJSON('{"test": 1}'),
  () => apiClient.formatJSON('{"test": 2}'),
  () => apiClient.formatJSON('{"test": 3}'),
  () => apiClient.formatJSON('{"test": 4}'),
  () => apiClient.formatJSON('{"test": 5}')
];

const results = await processor.addAll(requests);
```

## Caching Strategies

### 1. Response Caching

Cache API responses to avoid redundant requests:

```javascript
class APICache {
  constructor(maxSize = 100, defaultTTL = 300000) { // 5 minutes default
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Cleanup expired entries periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  generateKey(url, options = {}) {
    const keyData = {
      url,
      method: options.method || 'GET',
      body: options.body ? JSON.parse(options.body) : null,
      headers: options.headers || {}
    };
    
    // Remove headers that don't affect response
    delete keyData.headers['Authorization'];
    delete keyData.headers['X-Request-ID'];
    
    return btoa(JSON.stringify(keyData));
  }

  async get(url, options = {}) {
    const key = this.generateKey(url, options);
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access time for LRU
    item.lastAccessed = Date.now();
    return item.data;
  }

  async set(url, options, data, ttl = this.defaultTTL) {
    const key = this.generateKey(url, options);
    
    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
      created: Date.now(),
      lastAccessed: Date.now()
    });
  }

  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.hitRate,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  estimateMemoryUsage() {
    let totalSize = 0;
    for (const [key, item] of this.cache.entries()) {
      totalSize += key.length * 2; // Key size
      totalSize += JSON.stringify(item.data).length * 2; // Data size
      totalSize += 100; // Metadata overhead
    }
    return totalSize;
  }
}
```

### 2. Smart Caching with Invalidation

Implement intelligent caching with proper invalidation:

```javascript
class SmartCache {
  constructor() {
    this.cache = new APICache(100, 300000); // 5 minutes TTL
    this.dependencyGraph = new Map();
  }

  async request(url, options = {}) {
    const cacheKey = this.cache.generateKey(url, options);
    
    // Try cache first
    const cached = await this.cache.get(url, options);
    if (cached) {
      return cached;
    }

    // Make request
    const response = await fetch(url, options);
    const data = await response.json();
    
    // Cache response
    const ttl = this.calculateTTL(url, response);
    await this.cache.set(url, options, data, ttl);
    
    // Store dependencies
    this.storeDependencies(url, data);
    
    return data;
  }

  calculateTTL(url, response) {
    // Dynamic TTL based on response
    const cacheControl = response.headers.get('Cache-Control');
    
    if (cacheControl) {
      const maxAge = cacheControl.match(/max-age=(\d+)/);
      if (maxAge) {
        return parseInt(maxAge[1]) * 1000;
      }
    }

    // Default TTLs by endpoint
    const defaultTTLs = {
      '/tools/json/format': 600000, // 10 minutes
      '/tools/json/validate': 300000, // 5 minutes
      '/users/profile': 3600000, // 1 hour
      '/health': 30000 // 30 seconds
    };

    for (const [endpoint, ttl] of Object.entries(defaultTTLs)) {
      if (url.includes(endpoint)) {
        return ttl;
      }
    }

    return 300000; // 5 minutes default
  }

  storeDependencies(url, data) {
    // Track which cache entries depend on which data
    if (data.user_id) {
      if (!this.dependencyGraph.has(data.user_id)) {
        this.dependencyGraph.set(data.user_id, new Set());
      }
      this.dependencyGraph.get(data.user_id).add(url);
    }
  }

  invalidateByUser(userId) {
    const dependentKeys = this.dependencyGraph.get(userId);
    if (dependentKeys) {
      dependentKeys.forEach(key => {
        // Find and invalidate cache entries
        for (const [cacheKey, item] of this.cache.cache.entries()) {
          if (cacheKey.includes(key)) {
            this.cache.cache.delete(cacheKey);
          }
        }
      });
      this.dependencyGraph.delete(userId);
    }
  }

  invalidateByPattern(pattern) {
    const regex = new RegExp(pattern);
    
    for (const [key] of this.cache.cache.entries()) {
      if (regex.test(key)) {
        this.cache.cache.delete(key);
      }
    }
  }
}
```

### 3. Persistent Caching

Use persistent caching for better performance across restarts:

```javascript
class PersistentCache {
  constructor(storageKey = 'parsify_api_cache') {
    this.storageKey = storageKey;
    this.memoryCache = new Map();
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Filter out expired entries
        const now = Date.now();
        for (const [key, item] of Object.entries(data)) {
          if (now < item.expires) {
            this.memoryCache.set(key, item);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  saveToStorage() {
    try {
      const data = {};
      for (const [key, item] of this.memoryCache.entries()) {
        data[key] = item;
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  async get(key) {
    const item = this.memoryCache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expires) {
      this.memoryCache.delete(key);
      this.saveToStorage();
      return null;
    }
    
    return item.data;
  }

  async set(key, data, ttl = 300000) {
    const item = {
      data,
      expires: Date.now() + ttl,
      created: Date.now()
    };
    
    this.memoryCache.set(key, item);
    this.saveToStorage();
  }

  clear() {
    this.memoryCache.clear();
    localStorage.removeItem(this.storageKey);
  }
}
```

## Connection Management

### 1. HTTP Connection Pooling

Reuse HTTP connections for better performance:

```javascript
class ConnectionPool {
  constructor(maxConnections = 10) {
    this.maxConnections = maxConnections;
    this.connections = [];
    this.activeConnections = 0;
  }

  async getConnection() {
    // Reuse existing connection
    if (this.connections.length > 0) {
      return this.connections.pop();
    }

    // Create new connection if under limit
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      return this.createConnection();
    }

    // Wait for available connection
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (this.connections.length > 0) {
          resolve(this.connections.pop());
        } else {
          setTimeout(checkConnection, 10);
        }
      };
      checkConnection();
    });
  }

  createConnection() {
    // Return fetch with connection pooling
    return {
      fetch: async (url, options) => {
        // Add connection keep-alive headers
        const fetchOptions = {
          ...options,
          headers: {
            'Connection': 'keep-alive',
            'Keep-Alive': 'timeout=5, max=1000',
            ...options.headers
          }
        };

        try {
          return await fetch(url, fetchOptions);
        } finally {
          // Return connection to pool
          this.returnConnection(this);
        }
      }
    };
  }

  returnConnection(connection) {
    this.connections.push(connection);
  }

  async request(url, options) {
    const connection = await this.getConnection();
    return connection.fetch(url, options);
  }
}

// Usage
const connectionPool = new ConnectionPool(5);

const apiClient = {
  async request(url, options) {
    return connectionPool.request(url, options);
  }
};
```

### 2. Request Timeout and Retry Logic

Implement proper timeout and retry mechanisms:

```javascript
class RobustHTTPClient {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000; // 30 seconds default
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
  }

  async request(url, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.makeRequest(url, options);
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }
        
        const delay = this.calculateRetryDelay(attempt);
        console.warn(`Request failed (attempt ${attempt}), retrying in ${delay}ms:`, error.message);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  async makeRequest(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  shouldRetry(error, attempt) {
    // Don't retry if we've exceeded max attempts
    if (attempt >= this.maxRetries) {
      return false;
    }

    // Don't retry on client errors (4xx) except 429 (rate limit)
    if (error.status >= 400 && error.status < 500 && error.status !== 429) {
      return false;
    }

    // Don't retry on abort errors
    if (error.name === 'AbortError') {
      return false;
    }

    // Retry on network errors, timeouts, and server errors
    return true;
  }

  calculateRetryDelay(attempt) {
    // Exponential backoff with jitter
    const baseDelay = this.retryDelay * Math.pow(this.backoffMultiplier, attempt - 1);
    const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
    return Math.min(baseDelay + jitter, 30000); // Max 30 seconds
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Monitoring and Optimization

### 1. Performance Monitoring

Track API performance metrics:

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        totalResponseTime: 0
      },
      endpoints: new Map(),
      timeSeries: []
    };
    
    this.startMonitoring();
  }

  trackRequest(url, method, responseTime, success, statusCode) {
    const endpoint = this.extractEndpoint(url);
    
    // Update overall metrics
    this.metrics.requests.total++;
    this.metrics.requests.totalResponseTime += responseTime;
    
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Update endpoint metrics
    if (!this.metrics.endpoints.has(endpoint)) {
      this.metrics.endpoints.set(endpoint, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        successRate: 0,
        statusCodes: {}
      });
    }

    const endpointMetrics = this.metrics.endpoints.get(endpoint);
    endpointMetrics.count++;
    endpointMetrics.totalTime += responseTime;
    endpointMetrics.avgTime = endpointMetrics.totalTime / endpointMetrics.count;
    
    // Update success rate
    endpointMetrics.successRate = (endpointMetrics.count - 
      (endpointMetrics.statusCodes.failed || 0)) / endpointMetrics.count;
    
    // Track status codes
    const statusKey = statusCode < 400 ? 'success' : 'failed';
    endpointMetrics.statusCodes[statusKey] = (endpointMetrics.statusCodes[statusKey] || 0) + 1;

    // Add to time series (keep last 1000 entries)
    this.metrics.timeSeries.push({
      timestamp: Date.now(),
      endpoint,
      method,
      responseTime,
      success,
      statusCode
    });

    if (this.metrics.timeSeries.length > 1000) {
      this.metrics.timeSeries.shift();
    }

    // Alert on performance issues
    this.checkPerformanceAlerts(endpoint, responseTime, success, statusCode);
  }

  extractEndpoint(url) {
    // Extract endpoint pattern from URL
    const urlObj = new URL(url);
    return urlObj.pathname.replace(/\/[a-f0-9-]{36}/g, '/{id}'); // Replace UUIDs
  }

  checkPerformanceAlerts(endpoint, responseTime, success, statusCode) {
    // Alert on slow responses
    if (responseTime > 5000) {
      this.sendAlert('slow_response', {
        endpoint,
        responseTime,
        threshold: 5000
      });
    }

    // Alert on error rates
    const endpointMetrics = this.metrics.endpoints.get(endpoint);
    if (endpointMetrics && endpointMetrics.count > 10) {
      const errorRate = 1 - endpointMetrics.successRate;
      if (errorRate > 0.1) { // 10% error rate
        this.sendAlert('high_error_rate', {
          endpoint,
          errorRate: Math.round(errorRate * 100),
          threshold: 10
        });
      }
    }

    // Alert on specific status codes
    if (statusCode === 429) {
      this.sendAlert('rate_limit_exceeded', { endpoint });
    }

    if (statusCode >= 500) {
      this.sendAlert('server_error', {
        endpoint,
        statusCode
      });
    }
  }

  sendAlert(type, data) {
    const alert = {
      type,
      data,
      timestamp: Date.now()
    };

    console.warn('Performance alert:', alert);
    
    // Send to monitoring service
    this.sendToMonitoringService(alert);
  }

  sendToMonitoringService(alert) {
    // Send to your monitoring service (e.g., Sentry, DataDog, etc.)
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    }).catch(console.error);
  }

  getMetrics() {
    const avgResponseTime = this.metrics.requests.total > 0 
      ? this.metrics.requests.totalResponseTime / this.metrics.requests.total 
      : 0;

    return {
      overall: {
        totalRequests: this.metrics.requests.total,
        successRate: this.metrics.requests.total > 0 
          ? (this.metrics.requests.successful / this.metrics.requests.total) * 100 
          : 0,
        avgResponseTime: Math.round(avgResponseTime)
      },
      endpoints: Object.fromEntries(this.metrics.endpoints),
      recent: this.metrics.timeSeries.slice(-100)
    };
  }

  startMonitoring() {
    // Report metrics every minute
    setInterval(() => {
      const metrics = this.getMetrics();
      console.log('API Performance Metrics:', metrics);
      
      // Send to monitoring dashboard
      this.updateDashboard(metrics);
    }, 60000);
  }

  updateDashboard(metrics) {
    // Update performance dashboard
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics)
    }).catch(console.error);
  }
}

// Usage with fetch wrapper
const monitor = new PerformanceMonitor();

async function monitoredFetch(url, options = {}) {
  const startTime = Date.now();
  let success = false;
  let statusCode = 0;
  
  try {
    const response = await fetch(url, options);
    statusCode = response.status;
    success = response.ok;
    
    if (!success) {
      throw new Error(`HTTP ${statusCode}`);
    }
    
    return response;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const responseTime = Date.now() - startTime;
    monitor.trackRequest(url, options.method || 'GET', responseTime, success, statusCode);
  }
}
```

### 2. Cost Optimization

Optimize API usage to control costs:

```javascript
class CostOptimizer {
  constructor() {
    this.requestCosts = new Map();
    this.dailyBudget = 100; // $100 per day
    this.dailySpend = 0;
    this.lastResetDate = new Date().toDateString();
  }

  estimateRequestCost(endpoint, method, dataSize) {
    // Base costs per request type
    const baseCosts = {
      'GET': 0.001,    // $0.001 per GET request
      'POST': 0.005,   // $0.005 per POST request
      'PUT': 0.005,    // $0.005 per PUT request
      'DELETE': 0.001  // $0.001 per DELETE request
    };

    // Additional costs based on data size
    const dataCostPerMB = 0.01; // $0.01 per MB
    const dataMB = dataSize / (1024 * 1024);
    
    const baseCost = baseCosts[method] || 0.005;
    const dataCost = dataMB * dataCostPerMB;
    
    // Premium features cost more
    let multiplier = 1;
    if (endpoint.includes('/code/execute')) multiplier = 2;
    if (endpoint.includes('/upload/')) multiplier = 1.5;
    
    return (baseCost + dataCost) * multiplier;
  }

  canAffordRequest(endpoint, method, dataSize) {
    this.resetDailyBudgetIfNeeded();
    
    const cost = this.estimateRequestCost(endpoint, method, dataSize);
    return (this.dailySpend + cost) <= this.dailyBudget;
  }

  trackRequest(endpoint, method, dataSize) {
    const cost = this.estimateRequestCost(endpoint, method, dataSize);
    this.dailySpend += cost;
    
    const key = `${endpoint}:${method}`;
    this.requestCosts.set(key, (this.requestCosts.get(key) || 0) + cost);
    
    // Alert if approaching budget limit
    if (this.dailySpend > this.dailyBudget * 0.8) {
      console.warn(`Approaching daily budget limit: $${this.dailySpend.toFixed(2)} / $${this.dailyBudget}`);
    }
  }

  resetDailyBudgetIfNeeded() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailySpend = 0;
      this.lastResetDate = today;
    }
  }

  getCostReport() {
    this.resetDailyBudgetIfNeeded();
    
    const topCosts = Array.from(this.requestCosts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, cost]) => ({ endpoint, cost: cost.toFixed(4) }));

    return {
      dailySpend: this.dailySpend.toFixed(2),
      dailyBudget: this.dailyBudget,
      remainingBudget: (this.dailyBudget - this.dailySpend).toFixed(2),
      topCosts,
      totalEndpoints: this.requestCosts.size
    };
  }

  optimizeRequestBatch(requests) {
    // Sort requests by cost efficiency
    return requests.sort((a, b) => {
      const costA = this.estimateRequestCost(a.endpoint, a.method, a.dataSize);
      const costB = this.estimateRequestCost(b.endpoint, b.method, b.dataSize);
      return costA - costB;
    });
  }
}
```

## Performance Testing

### 1. Load Testing

Implement load testing to identify performance bottlenecks:

```javascript
class LoadTester {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.results = [];
  }

  async runLoadTest(config) {
    const {
      endpoint,
      method = 'GET',
      body,
      concurrency = 10,
      duration = 60000, // 1 minute
      rampUpTime = 10000 // 10 seconds
    } = config;

    console.log(`Starting load test: ${method} ${endpoint}`);
    console.log(`Concurrency: ${concurrency}, Duration: ${duration}ms`);

    const startTime = Date.now();
    const endTime = startTime + duration;
    const activeRequests = new Set();

    // Ramp up gradually
    const rampUpInterval = rampUpTime / concurrency;
    
    for (let i = 0; i < concurrency; i++) {
      setTimeout(() => {
        if (Date.now() < endTime) {
          this.runSingleRequest(endpoint, method, body, endTime, activeRequests);
        }
      }, i * rampUpInterval);
    }

    // Wait for all requests to complete
    return new Promise((resolve) => {
      const checkCompletion = () => {
        if (Date.now() >= endTime && activeRequests.size === 0) {
          const results = this.analyzeResults();
          resolve(results);
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      checkCompletion();
    });
  }

  async runSingleRequest(endpoint, method, body, endTime, activeRequests) {
    const requestId = Math.random().toString(36).substr(2, 9);
    activeRequests.add(requestId);

    const startTime = Date.now();
    let success = false;
    let statusCode = 0;
    let error = null;

    try {
      const response = await this.apiClient.request(endpoint, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json' }
      });

      statusCode = response.status;
      success = response.ok;
    } catch (err) {
      error = err.message;
      statusCode = err.status || 0;
    } finally {
      const responseTime = Date.now() - startTime;
      
      this.results.push({
        requestId,
        startTime,
        responseTime,
        success,
        statusCode,
        error
      });

      activeRequests.delete(requestId);

      // Schedule next request if within test duration
      if (Date.now() < endTime) {
        const delay = Math.random() * 100; // Random delay 0-100ms
        setTimeout(() => {
          this.runSingleRequest(endpoint, method, body, endTime, activeRequests);
        }, delay);
      }
    }
  }

  analyzeResults() {
    if (this.results.length === 0) {
      return { error: 'No results to analyze' };
    }

    const totalRequests = this.results.length;
    const successfulRequests = this.results.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;

    const responseTimes = this.results.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    responseTimes.sort((a, b) => a - b);
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];

    const minTime = Math.min(...responseTimes);
    const maxTime = Math.max(...responseTimes);

    const statusCodes = {};
    this.results.forEach(r => {
      statusCodes[r.statusCode] = (statusCodes[r.statusCode] || 0) + 1;
    });

    const duration = Math.max(...this.results.map(r => r.startTime)) - 
                     Math.min(...this.results.map(r => r.startTime));
    const requestsPerSecond = (totalRequests / duration) * 1000;

    return {
      summary: {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate: (successfulRequests / totalRequests) * 100,
        requestsPerSecond: requestsPerSecond.toFixed(2),
        duration: duration
      },
      responseTime: {
        average: avgResponseTime.toFixed(2),
        minimum: minTime,
        maximum: maxTime,
        p50: p50,
        p95: p95,
        p99: p99
      },
      statusCodes,
      errors: this.results.filter(r => r.error).map(r => r.error)
    };
  }

  clearResults() {
    this.results = [];
  }
}

// Usage
const loadTester = new LoadTester(apiClient);

async function runPerformanceTests() {
  // Test JSON formatting endpoint
  const formatTest = await loadTester.runLoadTest({
    endpoint: '/tools/json/format',
    method: 'POST',
    body: { json: '{"test": true}', indent: 2 },
    concurrency: 20,
    duration: 30000
  });

  console.log('JSON Format Load Test Results:', formatTest);

  loadTester.clearResults();

  // Test code execution endpoint
  const codeTest = await loadTester.runLoadTest({
    endpoint: '/tools/code/execute',
    method: 'POST',
    body: { code: 'print("test")', language: 'python' },
    concurrency: 5,
    duration: 30000
  });

  console.log('Code Execution Load Test Results:', codeTest);
}
```

This comprehensive performance optimization guide should help you build fast, efficient, and scalable applications using the Parsify API. Remember to monitor performance regularly and optimize based on real usage patterns.