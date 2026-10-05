import { randomBytes } from 'node:crypto'
import type { RequestHandler } from 'express'
import { ForbiddenError } from '../errors/app-error.js'

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

export const csrfProtectionMiddleware: RequestHandler = (req, _res, next) => {
  // Safe HTTP methods do not require CSRF token
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(req.method)) {
    return next()
  }

  // Exempt unauthenticated login endpoint from CSRF check
  if (req.path === '/api/v1/auth/login') {
    return next()
  }

  const tokenFromHeader = req.headers['x-csrf-token'] as string | undefined
  const sessionToken = req.session?.csrfToken

  if (!sessionToken || !tokenFromHeader || tokenFromHeader !== sessionToken) {
    return next(new ForbiddenError('Invalid or missing CSRF token.'))
  }

  next()
}
