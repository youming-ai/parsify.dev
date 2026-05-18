import pino from 'pino';

export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  redact: {
    paths: ['*.apiKey', '*.headers.authorization', '*.headers.cookie'],
    censor: '[REDACTED]',
  },
  transport: process.env['NODE_ENV'] === 'development' ? { target: 'pino-pretty' } : undefined,
});
