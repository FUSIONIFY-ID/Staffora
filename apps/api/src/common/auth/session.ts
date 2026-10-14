import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import pg from 'pg'
import type { CookieOptions, Request, RequestHandler, Response } from 'express'
import { loadEnv } from '../../config/env.js'

const PgSession = connectPgSimple(session)

export const SESSION_COOKIE_NAME = 'staffora.sid'
const SESSION_INACTIVITY_TIMEOUT_MS = 8 * 60 * 60 * 1000
// loadEnv() rejects a missing SESSION_SECRET in production, so this value can only apply locally.
const NON_PRODUCTION_SESSION_SECRET = 'local-dev-session-secret-at-least-32-characters-long'

function buildSessionCookieOptions(isProduction: boolean): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', path: '/', secure: isProduction }
}

export function createSessionMiddleware(options?: {
  connectionString?: string
  sessionSecret?: string
  isProduction?: boolean
  useMemoryStore?: boolean
}): RequestHandler {
  const env = loadEnv()
  const secret = options?.sessionSecret ?? env.SESSION_SECRET ?? NON_PRODUCTION_SESSION_SECRET
  const isProduction = options?.isProduction ?? env.NODE_ENV === 'production'
  const connectionString = options?.connectionString ?? env.DATABASE_URL

  let store: session.Store | undefined

  if (!options?.useMemoryStore && connectionString) {
    store = new PgSession({
      pool: new pg.Pool({ connectionString }),
      tableName: 'user_sessions',
      createTableIfMissing: false,
    })
  }

  return session({
    store,
    name: SESSION_COOKIE_NAME,
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { ...buildSessionCookieOptions(isProduction), maxAge: SESSION_INACTIVITY_TIMEOUT_MS },
  })
}

export function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error: unknown) => (error ? reject(error) : resolve()))
  })
}

export function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((error: unknown) => (error ? reject(error) : resolve()))
  })
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, buildSessionCookieOptions(loadEnv().NODE_ENV === 'production'))
}
