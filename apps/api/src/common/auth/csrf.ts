import { randomBytes, timingSafeEqual } from 'node:crypto'
import type { RequestHandler } from 'express'
import { ForbiddenError } from '../errors/app-error.js'

// Every state-changing request is checked, sign-in included (CLAUDE.md, CODING_STANDARD 7.2).
// Before sign-in the browser gets its token from GET /auth/csrf-token on an anonymous session.
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

function tokensMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer)
}

export const csrfProtectionMiddleware: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.includes(req.method)) {
    return next()
  }

  const headerToken = req.headers['x-csrf-token']
  const sessionToken = req.session?.csrfToken

  if (typeof headerToken !== 'string' || !sessionToken || !tokensMatch(headerToken, sessionToken)) {
    return next(new ForbiddenError('Invalid or missing CSRF token.'))
  }

  next()
}
