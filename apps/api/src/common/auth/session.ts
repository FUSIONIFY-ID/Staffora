import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import pg from 'pg'
import type { RequestHandler } from 'express'

const PgSession = connectPgSimple(session)

export function createSessionMiddleware(options?: {
  connectionString?: string
  sessionSecret?: string
  isProduction?: boolean
  useMemoryStore?: boolean
}): RequestHandler {
  const secret = options?.sessionSecret || process.env.SESSION_SECRET || 'local-dev-session-secret-at-least-32-characters-long'
  const isProduction = options?.isProduction ?? process.env.NODE_ENV === 'production'

  let store: session.Store | undefined

  if (!options?.useMemoryStore && (options?.connectionString || process.env.DATABASE_URL)) {
    const pool = new pg.Pool({
      connectionString: options?.connectionString || process.env.DATABASE_URL,
    })
    store = new PgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: false,
    })
  }

  return session({
    store,
    name: 'staffora.sid',
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProduction,
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
}
