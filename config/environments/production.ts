/**
 * Production Environment Configuration
 *
 * This configuration defines all settings for the production environment.
 * Production is the live environment used by end users.
 */

export const productionConfig = {
  // Basic environment settings
  environment: 'production',
  debug: false,
  logLevel: 'info',

  // API Configuration
  api: {
    version: 'v1',
    baseUrl: 'https://api.parsify.dev',
    timeout: 30000,
    maxRequestSize: '10MB',
    enableCors: true,
    corsOrigins: [
      'https://parsify.dev',
      'https://www.parsify.dev',
      'https://app.parsify.dev'
    ]
  },

  // Web Application Configuration
  web: {
    baseUrl: 'https://parsify.dev',
    title: 'Parsify - Online Developer Tools',
    description: 'Professional online developer tools for parsing, formatting, and manipulating data',
    enableAnalytics: true,
    enableSentry: true,
    enableFeatureFlags: true
  },

  // Database Configuration (Cloudflare D1)
  database: {
    name: 'parsify-prod',
    id: process.env.PROD_DATABASE_ID || 'your-production-database-id',
    connectionTimeout: 5000,
    queryTimeout: 15000,
    enableQueryLogging: false,
    maxConnections: 500
  },

  // Storage Configuration
  storage: {
    // R2 Buckets
    r2: {
      files: {
        bucketName: 'parsify-files-prod',
        bucketId: process.env.PROD_R2_FILES_BUCKET_ID || 'your-production-files-bucket-id',
        maxFileSize: '50MB',
        allowedFileTypes: ['text/*', 'application/json', 'application/xml', 'application/javascript', 'application/yaml']
      },
      backups: {
        bucketName: 'parsify-backups-prod',
        bucketId: process.env.PROD_R2_BACKUPS_BUCKET_ID || 'your-production-backups-bucket-id'
      }
    },

    // KV Namespaces
    kv: {
      cache: {
        namespaceId: process.env.PROD_KV_CACHE_ID || 'your-production-cache-kv-id',
        ttl: 7200, // 2 hours
        maxTtl: 604800 // 7 days
      },
      sessions: {
        namespaceId: process.env.PROD_KV_SESSIONS_ID || 'your-production-sessions-kv-id',
        ttl: 86400 // 24 hours
      },
      uploads: {
        namespaceId: process.env.PROD_KV_UPLOADS_ID || 'your-production-uploads-kv-id',
        ttl: 3600 // 1 hour
      },
      analytics: {
        namespaceId: process.env.PROD_KV_ANALYTICS_ID || 'your-production-analytics-kv-id',
        ttl: 2592000 // 30 days
      }
    }
  },

  // Durable Objects Configuration
  durableObjects: {
    sessionManager: {
      className: 'SessionManagerDurableObject',
      scriptName: 'parsify-api-prod',
      maxConcurrentSessions: 10000,
      sessionTimeout: 1800000 // 30 minutes
    },
    collaborationRoom: {
      className: 'CollaborationRoomDurableObject',
      scriptName: 'parsify-api-prod',
      maxRoomSize: 100,
      roomTimeout: 1800000 // 30 minutes
    },
    realtimeSync: {
      className: 'RealtimeSyncDurableObject',
      scriptName: 'parsify-api-prod',
      maxConnections: 5000,
      syncInterval: 500 // 0.5 seconds
    }
  },

  // Queue Configuration
  queues: {
    analytics: {
      name: 'analytics-events-prod',
      batchSize: 500,
      maxRetries: 5,
      retryDelay: 10000
    },
    uploads: {
      name: 'file-uploads-prod',
      batchSize: 100,
      maxRetries: 7,
      retryDelay: 15000
    },
    notifications: {
      name: 'notifications-prod',
      batchSize: 1000,
      maxRetries: 5,
      retryDelay: 5000
    }
  },

  // Security Configuration
  security: {
    jwt: {
      secret: process.env.PROD_JWT_SECRET || 'your-production-jwt-secret',
      expiresIn: '7d',
      issuer: 'parsify-prod',
      audience: 'parsify-users'
    },
    encryption: {
      algorithm: 'AES-256-GCM',
      key: process.env.PROD_ENCRYPTION_KEY || 'your-production-encryption-key'
    },
    rateLimit: {
      enabled: true,
      windowMs: 900000, // 15 minutes
      maxRequests: 100,
      skipSuccessfulRequests: true
    }
  },

  // Monitoring and Analytics
  monitoring: {
    sentry: {
      dsn: process.env.PROD_SENTRY_DSN || 'https://your-production-dsn.ingest.sentry.io/project-id',
      environment: 'production',
      tracesSampleRate: 0.05,
      profilesSampleRate: 0.05,
      debug: false,
      enablePerformance: true,
      enableReplay: true,
      replaySessionSampleRate: 0.05,
      replayErrorSampleRate: 1.0
    },
    analytics: {
      enabled: true,
      sampleRate: 0.1, // 10% sampling for production
      anonymizeIp: true,
      debugMode: false
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
    enableBetaFeatures: false, // Disabled in production
    enableDebugMode: false
  },

  // Performance Configuration
  performance: {
    enableCaching: true,
    cacheTimeout: 600, // 10 minutes
    enableCompression: true,
    compressionLevel: 9,
    enableMinification: true,
    enableBundleAnalysis: false
  },

  // Development Tools
  development: {
    enableHotReload: false,
    enableSourceMaps: false,
    enableDebugEndpoints: false,
    enableTestData: false,
    enableMockServices: false
  },

  // External Services
  services: {
    email: {
      provider: 'resend',
      apiKey: process.env.PROD_EMAIL_API_KEY || 'your-production-email-api-key',
      fromAddress: 'noreply@parsify.dev'
    },
    analytics: {
      provider: 'plausible',
      domain: 'parsify.dev',
      apiKey: process.env.PROD_ANALYTICS_API_KEY || 'your-production-analytics-api-key'
    },
    cdn: {
      provider: 'cloudflare',
      zoneId: process.env.PROD_CLOUDFLARE_ZONE_ID || 'your-production-zone-id'
    }
  },

  // Scheduled Tasks
  scheduledTasks: {
    cleanup: {
      enabled: true,
      schedule: '0 */6 * * *', // Every 6 hours
      retentionDays: 30
    },
    backup: {
      enabled: true,
      schedule: '0 2 * * *', // Daily at 2 AM
      retentionDays: 90
    },
    analytics: {
      enabled: true,
      schedule: '0 * * * *', // Every hour
      aggregationWindow: 3600 // 1 hour
    }
  },

  // High Availability Configuration
  highAvailability: {
    enabled: true,
    regions: ['iad1', 'dfw', 'sfo'], // Multiple regions for redundancy
    failoverEnabled: true,
    healthCheckInterval: 30000, // 30 seconds
    maxFailuresBeforeFailover: 3
  },

  // Scalability Configuration
  scalability: {
    autoScaling: true,
    minInstances: 2,
    maxInstances: 100,
    cpuThreshold: 70,
    memoryThreshold: 80,
    responseTimeThreshold: 1000, // 1 second
    scaleUpCooldown: 300000, // 5 minutes
    scaleDownCooldown: 600000 // 10 minutes
  },

  // Compliance and Security
  compliance: {
    gdpr: {
      enabled: true,
      dataRetentionDays: 365,
      anonymizationEnabled: true
    },
    ccpa: {
      enabled: true,
      dataDeletionEnabled: true
    },
    securityHeaders: {
      strictTransportSecurity: true,
      contentSecurityPolicy: true,
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff'
    }
  }
} as const;

export type ProductionConfig = typeof productionConfig;

// Environment validation
export function validateProductionConfig(): boolean {
  const requiredEnvVars = [
    'PROD_DATABASE_ID',
    'PROD_JWT_SECRET',
    'PROD_ENCRYPTION_KEY',
    'PROD_SENTRY_DSN',
    'PROD_EMAIL_API_KEY',
    'PROD_ANALYTICS_API_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables for production:', missingVars);
    return false;
  }

  // Validate secret strength
  if (process.env.PROD_JWT_SECRET && process.env.PROD_JWT_SECRET.length < 32) {
    console.error('JWT secret must be at least 32 characters long');
    return false;
  }

  if (process.env.PROD_ENCRYPTION_KEY && process.env.PROD_ENCRYPTION_KEY.length < 32) {
    console.error('Encryption key must be at least 32 characters long');
    return false;
  }

  return true;
}

// Health check configuration
export const productionHealthCheck = {
  endpoints: [
    '/health',
    '/api/v1/health',
    '/api/v1/status'
  ],
  timeout: 5000,
  retries: 5,
  expectedStatusCodes: [200, 201, 204],
  criticalServices: [
    'database',
    'cache',
    'storage'
  ]
};

// Deployment configuration
export const productionDeployment = {
  environment: 'production',
  regions: ['iad1', 'dfw', 'sfo'], // Multi-region deployment
  minInstances: 2,
  maxInstances: 100,
  cpuThreshold: 70,
  memoryThreshold: 80,
  enableRollback: true,
  rollbackTimeout: 600000, // 10 minutes
  deploymentStrategy: 'blue-green',
  healthCheckGracePeriod: 30000 // 30 seconds
};

// Incident response configuration
export const incidentResponse = {
  alerting: {
    enabled: true,
    channels: ['email', 'slack', 'sentry'],
    escalationRules: [
      { level: 'warning', delay: 300 }, // 5 minutes
      { level: 'critical', delay: 60 }, // 1 minute
      { level: 'emergency', delay: 0 } // Immediate
    ]
  },
  runbooks: {
    enabled: true,
    location: 'https://github.com/parsify-dev/runbooks'
  },
  postMortem: {
    requiredForCritical: true,
    template: 'post-mortem-template.md'
  }
};
