/**
 * Staging Environment Configuration
 *
 * This configuration defines all settings for the staging environment.
 * Staging is used for testing features before they go to production.
 */

export const stagingConfig = {
  // Basic environment settings
  environment: 'staging',
  debug: true,
  logLevel: 'debug',

  // API Configuration
  api: {
    version: 'v1',
    baseUrl: 'https://api-staging.parsify.dev',
    timeout: 30000,
    maxRequestSize: '10MB',
    enableCors: true,
    corsOrigins: [
      'https://staging.parsify.dev',
      'https://parsify-dev.pages.dev',
      'http://localhost:3000'
    ]
  },

  // Web Application Configuration
  web: {
    baseUrl: 'https://staging.parsify.dev',
    title: 'Parsify - Staging Environment',
    description: 'Online Developer Tools Platform - Staging Environment',
    enableAnalytics: true,
    enableSentry: true,
    enableFeatureFlags: true
  },

  // Database Configuration (Cloudflare D1)
  database: {
    name: 'parsify-staging',
    id: process.env.STAGING_DATABASE_ID || 'your-staging-database-id',
    connectionTimeout: 10000,
    queryTimeout: 30000,
    enableQueryLogging: true,
    maxConnections: 100
  },

  // Storage Configuration
  storage: {
    // R2 Buckets
    r2: {
      files: {
        bucketName: 'parsify-files-staging',
        bucketId: process.env.STAGING_R2_FILES_BUCKET_ID || 'your-staging-files-bucket-id',
        maxFileSize: '100MB',
        allowedFileTypes: ['text/*', 'application/json', 'application/xml', 'application/javascript']
      },
      backups: {
        bucketName: 'parsify-backups-staging',
        bucketId: process.env.STAGING_R2_BACKUPS_BUCKET_ID || 'your-staging-backups-bucket-id'
      }
    },

    // KV Namespaces
    kv: {
      cache: {
        namespaceId: process.env.STAGING_KV_CACHE_ID || 'your-staging-cache-kv-id',
        ttl: 3600, // 1 hour
        maxTtl: 86400 // 24 hours
      },
      sessions: {
        namespaceId: process.env.STAGING_KV_SESSIONS_ID || 'your-staging-sessions-kv-id',
        ttl: 7200 // 2 hours
      },
      uploads: {
        namespaceId: process.env.STAGING_KV_UPLOADS_ID || 'your-staging-uploads-kv-id',
        ttl: 14400 // 4 hours
      },
      analytics: {
        namespaceId: process.env.STAGING_KV_ANALYTICS_ID || 'your-staging-analytics-kv-id',
        ttl: 604800 // 7 days
      }
    }
  },

  // Durable Objects Configuration
  durableObjects: {
    sessionManager: {
      className: 'SessionManagerDurableObject',
      scriptName: 'parsify-api-staging',
      maxConcurrentSessions: 1000,
      sessionTimeout: 7200000 // 2 hours
    },
    collaborationRoom: {
      className: 'CollaborationRoomDurableObject',
      scriptName: 'parsify-api-staging',
      maxRoomSize: 50,
      roomTimeout: 3600000 // 1 hour
    },
    realtimeSync: {
      className: 'RealtimeSyncDurableObject',
      scriptName: 'parsify-api-staging',
      maxConnections: 500,
      syncInterval: 1000 // 1 second
    }
  },

  // Queue Configuration
  queues: {
    analytics: {
      name: 'analytics-events-staging',
      batchSize: 100,
      maxRetries: 3,
      retryDelay: 5000
    },
    uploads: {
      name: 'file-uploads-staging',
      batchSize: 50,
      maxRetries: 5,
      retryDelay: 10000
    },
    notifications: {
      name: 'notifications-staging',
      batchSize: 200,
      maxRetries: 3,
      retryDelay: 3000
    }
  },

  // Security Configuration
  security: {
    jwt: {
      secret: process.env.STAGING_JWT_SECRET || 'your-staging-jwt-secret',
      expiresIn: '24h',
      issuer: 'parsify-staging',
      audience: 'parsify-users'
    },
    encryption: {
      algorithm: 'AES-256-GCM',
      key: process.env.STAGING_ENCRYPTION_KEY || 'your-staging-encryption-key'
    },
    rateLimit: {
      enabled: true,
      windowMs: 900000, // 15 minutes
      maxRequests: 1000,
      skipSuccessfulRequests: false
    }
  },

  // Monitoring and Analytics
  monitoring: {
    sentry: {
      dsn: process.env.STAGING_SENTRY_DSN || 'https://your-staging-dsn.ingest.sentry.io/project-id',
      environment: 'staging',
      tracesSampleRate: 0.2,
      profilesSampleRate: 0.2,
      debug: true,
      enablePerformance: true,
      enableReplay: true,
      replaySessionSampleRate: 0.1,
      replayErrorSampleRate: 1.0
    },
    analytics: {
      enabled: true,
      sampleRate: 1.0, // 100% for staging
      anonymizeIp: false,
      debugMode: true
    }
  },

  // Feature Flags
  features: {
    enableRealTimeCollaboration: true,
    enableAdvancedTools: true,
    enableFileUploads: true,
    enableUserAuthentication: true,
    enableAnalytics: true,
    enableNotifications: true,
    enableBetaFeatures: true,
    enableDebugMode: true
  },

  // Performance Configuration
  performance: {
    enableCaching: true,
    cacheTimeout: 300, // 5 minutes
    enableCompression: true,
    compressionLevel: 6,
    enableMinification: true,
    enableBundleAnalysis: true
  },

  // Development Tools
  development: {
    enableHotReload: true,
    enableSourceMaps: true,
    enableDebugEndpoints: true,
    enableTestData: true,
    enableMockServices: false
  },

  // External Services
  services: {
    email: {
      provider: 'resend',
      apiKey: process.env.STAGING_EMAIL_API_KEY || 'your-staging-email-api-key',
      fromAddress: 'staging@parsify.dev'
    },
    analytics: {
      provider: 'plausible',
      domain: 'staging.parsify.dev',
      apiKey: process.env.STAGING_ANALYTICS_API_KEY || 'your-staging-analytics-api-key'
    },
    cdn: {
      provider: 'cloudflare',
      zoneId: process.env.STAGING_CLOUDFLARE_ZONE_ID || 'your-staging-zone-id'
    }
  },

  // Scheduled Tasks
  scheduledTasks: {
    cleanup: {
      enabled: true,
      schedule: '0 */6 * * *', // Every 6 hours
      retentionDays: 7
    },
    backup: {
      enabled: true,
      schedule: '0 2 * * *', // Daily at 2 AM
      retentionDays: 30
    },
    analytics: {
      enabled: true,
      schedule: '0 * * * *', // Every hour
      aggregationWindow: 3600 // 1 hour
    }
  }
} as const;

export type StagingConfig = typeof stagingConfig;

// Environment validation
export function validateStagingConfig(): boolean {
  const requiredEnvVars = [
    'STAGING_DATABASE_ID',
    'STAGING_JWT_SECRET',
    'STAGING_ENCRYPTION_KEY',
    'STAGING_SENTRY_DSN'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables for staging:', missingVars);
    return false;
  }

  return true;
}

// Health check configuration
export const stagingHealthCheck = {
  endpoints: [
    '/health',
    '/api/v1/health',
    '/api/v1/status'
  ],
  timeout: 10000,
  retries: 3,
  expectedStatusCodes: [200, 201, 204]
};

// Deployment configuration
export const stagingDeployment = {
  environment: 'staging',
  regions: ['iad1'], // US East
  minInstances: 1,
  maxInstances: 10,
  cpuThreshold: 80,
  memoryThreshold: 80,
  enableRollback: true,
  rollbackTimeout: 300000 // 5 minutes
};
