import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import pg from 'pg'
import type { CookieOptions, Request, RequestHandler, Response } from 'express'
import { loadEnv } from '../../config/env.js'
import { generateCsrfToken } from './csrf.js'

const PgSession = connectPgSimple(session)

// One pool per connection string for the whole process, so building more than one app
// (as the test suites do) does not leave a new, never-closed pool behind each time.
const sessionPools = new Map<string, pg.Pool>()

function getSessionPool(connectionString: string): pg.Pool {
  const existing = sessionPools.get(connectionString)
  if (existing) {
    return existing
  }
  const pool = new pg.Pool({ connectionString })
  sessionPools.set(connectionString, pool)
  return pool
}

/** Ends every pool opened for the PostgreSQL session store. Call on shutdown or after tests. */
export async function closeSessionStore(): Promise<void> {
  const pools = [...sessionPools.values()]
  sessionPools.clear()
  await Promise.all(pools.map((pool) => pool.end()))
}

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
      pool: getSessionPool(connectionString),
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

/**
 * Starts an authenticated session after a successful login. The session ID is regenerated
 * first to prevent session fixation (TSD 8.1); the returned CSRF token is the synchronizer
 * token stored with the new session (TSD 8.3).
 */
export async function establishSession(req: Request, userId: string): Promise<string> {
  await regenerateSession(req)
  const csrfToken = generateCsrfToken()
  req.session.userId = userId
  req.session.csrfToken = csrfToken
  return csrfToken
}

/** Returns the session's CSRF token, issuing one first if the session does not have one yet. */
export function ensureCsrfToken(req: Request): string {
  const existing = req.session.csrfToken
  if (existing) {
    return existing
  }
  const csrfToken = generateCsrfToken()
  req.session.csrfToken = csrfToken
  return csrfToken
}

export function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((error: unknown) => (error ? reject(error) : resolve()))
  })
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, buildSessionCookieOptions(loadEnv().NODE_ENV === 'production'))
}
