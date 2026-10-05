import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'password',
      'passwordHash',
      'req.headers.cookie',
      'req.headers.authorization',
      'req.headers["x-csrf-token"]',
      'session',
      'csrfToken',
      '*.password',
      '*.passwordHash',
    ],
    censor: '[REDACTED]',
  },
})
