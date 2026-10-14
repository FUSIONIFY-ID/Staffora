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
      'res.headers["set-cookie"]',
      // Workforce directory search takes a person's name; app.ts also strips the
      // query string from the logged URL so it cannot leak through either field.
      'req.query.search',
      'session',
      'csrfToken',
      '*.password',
      '*.passwordHash',
    ],
    censor: '[REDACTED]',
  },
})
