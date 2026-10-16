import express from 'express'
import bcrypt from 'bcryptjs'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSessionMiddleware } from '../src/common/auth/session.js'
import { csrfProtectionMiddleware } from '../src/common/auth/csrf.js'
import { hashPassword, verifyPassword } from '../src/common/auth/password.js'
import { errorHandler } from '../src/common/errors/error-handler.js'
import { createApp } from '../src/app.js'

const KNOWN_CSRF_TOKEN = 'a'.repeat(64)

function buildSessionApp(isProduction: boolean): express.Express {
  const app = express()
  if (isProduction) {
    app.set('trust proxy', 1)
  }
  app.use(createSessionMiddleware({ useMemoryStore: true, isProduction, sessionSecret: 's'.repeat(32) }))
  app.get('/start', (req, res) => {
    req.session.csrfToken = KNOWN_CSRF_TOKEN
    res.status(204).end()
  })
  app.use(csrfProtectionMiddleware)
  app.post('/mutate', (_req, res) => {
    res.status(204).end()
  })
  app.post('/api/v1/auth/login', (_req, res) => {
    res.status(204).end()
  })
  app.use(errorHandler)
  return app
}

function firstCookie(headers: Record<string, unknown>): string {
  const setCookie = headers['set-cookie']
  return Array.isArray(setCookie) && typeof setCookie[0] === 'string' ? setCookie[0] : ''
}

describe('session cookie security (US01.01, ADR-006)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('issues an HttpOnly, SameSite=Lax, Path=/ cookie without Secure outside production', async () => {
    const response = await request(buildSessionApp(false)).get('/start')
    const cookie = firstCookie(response.headers)

    expect(cookie).toMatch(/^staffora\.sid=/)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/')
    expect(cookie).toMatch(/Expires=/)
    expect(cookie).not.toContain('Secure')
  })

  it('issues a Secure cookie in production when Nginx forwards HTTPS', async () => {
    const response = await request(buildSessionApp(true)).get('/start').set('X-Forwarded-Proto', 'https')
    expect(firstCookie(response.headers)).toContain('Secure')
  })

  it('trusts exactly one proxy hop when the API runs in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('SESSION_SECRET', 'p'.repeat(32))
    vi.stubEnv('DATABASE_URL', 'postgresql://staffora:secret@localhost:5432/staffora')

    expect(createApp({ useMemorySession: true }).get('trust proxy')).toBe(1)
  })

  it('does not trust proxy headers outside production', () => {
    expect(createApp({ useMemorySession: true }).get('trust proxy')).toBe(false)
  })
})

describe('CSRF synchronizer token (US01.01, TSD 8.3)', () => {
  it('rejects a state-changing request without the X-CSRF-Token header', async () => {
    const app = buildSessionApp(false)
    const cookie = firstCookie((await request(app).get('/start')).headers)

    const response = await request(app).post('/mutate').set('Cookie', cookie)
    expect(response.status).toBe(403)
    expect(response.body.code).toBe('FORBIDDEN')
  })

  it('rejects a mismatched token', async () => {
    const app = buildSessionApp(false)
    const cookie = firstCookie((await request(app).get('/start')).headers)

    const response = await request(app).post('/mutate').set('Cookie', cookie).set('X-CSRF-Token', 'b'.repeat(64))
    expect(response.status).toBe(403)
  })

  it('rejects a request without a session even if a header is sent', async () => {
    const response = await request(buildSessionApp(false)).post('/mutate').set('X-CSRF-Token', KNOWN_CSRF_TOKEN)
    expect(response.status).toBe(403)
  })

  it('accepts the matching session token', async () => {
    const app = buildSessionApp(false)
    const cookie = firstCookie((await request(app).get('/start')).headers)

    const response = await request(app).post('/mutate').set('Cookie', cookie).set('X-CSRF-Token', KNOWN_CSRF_TOKEN)
    expect(response.status).toBe(204)
  })

  it('does not exempt the login endpoint (CLAUDE.md, CODING_STANDARD 7.2)', async () => {
    const app = buildSessionApp(false)
    const cookie = firstCookie((await request(app).get('/start')).headers)

    const withoutToken = await request(app).post('/api/v1/auth/login').set('Cookie', cookie)
    expect(withoutToken.status).toBe(403)
    expect(withoutToken.body.code).toBe('FORBIDDEN')

    const withToken = await request(app).post('/api/v1/auth/login').set('Cookie', cookie).set('X-CSRF-Token', KNOWN_CSRF_TOKEN)
    expect(withToken.status).toBe(204)
  })
})

describe('password hashing (US01.01, TSD 8.2)', () => {
  it('hashes with bcrypt cost factor 12 and verifies the original password', async () => {
    const hash = await hashPassword('CorrectHorse12!')

    expect(bcrypt.getRounds(hash)).toBe(12)
    await expect(verifyPassword('CorrectHorse12!', hash)).resolves.toBe(true)
    await expect(verifyPassword('WrongHorse12!', hash)).resolves.toBe(false)
  })

  it('returns false for an unknown account while still performing a comparison', async () => {
    const compareSpy = vi.spyOn(bcrypt, 'compare')

    await expect(verifyPassword('AnyPassword12!', null)).resolves.toBe(false)
    expect(compareSpy).toHaveBeenCalledTimes(1)
    compareSpy.mockRestore()
  })
})
