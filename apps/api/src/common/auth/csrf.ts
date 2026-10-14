import { randomBytes, timingSafeEqual } from 'node:crypto'
import type { RequestHandler } from 'express'
import { ForbiddenError } from '../errors/app-error.js'

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']
const CSRF_EXEMPT_PATHS = ['/api/v1/auth/login']

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

function tokensMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer)
}

export const csrfProtectionMiddleware: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.includes(req.method) || CSRF_EXEMPT_PATHS.includes(req.path)) {
    return next()
  }

  const headerToken = req.headers['x-csrf-token']
  const sessionToken = req.session?.csrfToken

  if (typeof headerToken !== 'string' || !sessionToken || !tokensMatch(headerToken, sessionToken)) {
    return next(new ForbiddenError('Invalid or missing CSRF token.'))
  }

  next()
}
