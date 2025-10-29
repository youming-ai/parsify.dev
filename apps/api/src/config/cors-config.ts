/**
 * CORS configuration for separated architecture
 * Simplified configuration for Workers API
 */

export const getCorsConfig = (environment: string) => {
  const allowedOrigins = {
    production: [
      'https://parsify.dev',
      'https://www.parsify.dev',
      'https://app.parsify.dev'
    ],
    staging: [
      'https://parsify.dev',
      'https://staging.parsify.dev',
      'https://preview.parsify.dev'
    ],
    development: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ]
  };

  const origins = allowedOrigins[environment as keyof typeof allowedOrigins] || allowedOrigins.development;

  return {
    origin: origins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
      'Accept',
      'Origin',
      'User-Agent',
      'Cache-Control'
    ],
    exposeHeaders: [
      'X-Total-Count',
      'X-Rate-Limit-Limit',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
      'X-Request-ID',
      'Content-Length'
    ],
    credentials: true,
    maxAge: 86400
  };
};

export const getPublicCorsConfig = () => {
  return {
    origin: '*', // Allow any origin for public API
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'User-Agent'
    ],
    credentials: false,
    maxAge: 3600
  };
};

export const getAdminCorsConfig = () => {
  return {
    origin: ['https://admin.parsify.dev'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Admin-Token'
    ],
    credentials: true,
    maxAge: 86400
  };
};
