import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/common/database/prisma.js'
import { hashPassword } from '../src/common/auth/password.js'
import { closeSessionStore } from '../src/common/auth/session.js'
import { fetchCsrfSession, postLogin, sessionCookieFrom as sessionCookie } from './support/auth-login.js'

// Uses the real PostgreSQL session store (connect-pg-simple), so DATABASE_URL must be set.
const app = createApp()
const TEST_PASSWORD = 'IntegrationPass2026!'
const createdUserIds: string[] = []

async function createTestUser(label: string): Promise<{ id: string; email: string }> {
  const email = `us0101-${label}-${randomUUID()}@staffora.test`
  const user = await prisma.user.create({
    data: { normalizedEmail: email, passwordHash: await hashPassword(TEST_PASSWORD), role: 'EMPLOYEE' },
  })
  createdUserIds.push(user.id)
  return { id: user.id, email }
}

function sessionIdFromCookie(cookie: string): string {
  // Signed cookie format: staffora.sid=s:<sid>.<signature>
  const value = decodeURIComponent(cookie.replace('staffora.sid=', ''))
  return value.slice(2, value.lastIndexOf('.'))
}

async function login(email: string, cookie?: string): Promise<request.Response> {
  return postLogin(app, { email, password: TEST_PASSWORD }, cookie)
}

async function isAuthenticated(cookie: string): Promise<boolean> {
  const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie)
  return me.status === 200
}

afterAll(async () => {
  await prisma.$executeRaw`DELETE FROM user_sessions WHERE sess->>'userId' = ANY(${createdUserIds}::text[])`
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
  await closeSessionStore()
})

describe('session authentication API with PostgreSQL store (US01.01)', () => {
  it('persists the session in user_sessions and returns identity plus CSRF token (AC02.01, AC03.01)', async () => {
    const user = await createTestUser('persist')
    const response = await login(user.email)

    expect(response.status).toBe(200)
    expect(response.body.data.user).toMatchObject({ id: user.id, email: user.email, role: 'EMPLOYEE', isActive: true })
    expect(response.body.data.user).not.toHaveProperty('passwordHash')
    expect(typeof response.body.data.csrfToken).toBe('string')

    const cookie = sessionCookie(response.headers)
    const row = await prisma.userSession.findUnique({ where: { sid: sessionIdFromCookie(cookie) } })
    expect(row).not.toBeNull()

    const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie)
    expect(me.status).toBe(200)
    expect(me.body.data.id).toBe(user.id)
  })

  it('rejects protected endpoints when the request carries no session cookie (AC03.02)', async () => {
    const protectedEndpoints = ['/api/v1/auth/me', '/api/v1/users', '/api/v1/employees']

    for (const endpoint of protectedEndpoints) {
      const response = await request(app).get(endpoint)

      expect(response.status, endpoint).toBe(401)
      expect(response.body.code, endpoint).toBe('UNAUTHORIZED')
      expect(response.body).not.toHaveProperty('data')
      expect(sessionCookie(response.headers), endpoint).toBe('')
    }
  })

  it('rejects a session cookie whose signature does not verify (AC03.02)', async () => {
    // express-session drops this cookie at signature verification, before the store is read.
    const forgedCookie = `staffora.sid=${encodeURIComponent(`s:${randomUUID()}.forged-signature`)}`

    const response = await request(app).get('/api/v1/auth/me').set('Cookie', forgedCookie)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('UNAUTHORIZED')
  })

  it('rejects a validly signed cookie whose session row no longer exists (AC03.02)', async () => {
    const user = await createTestUser('missing-row')
    const cookie = sessionCookie((await login(user.email)).headers)
    expect(await isAuthenticated(cookie)).toBe(true)

    // The signature stays valid; only the server-side session is gone, so the store lookup decides.
    await prisma.userSession.delete({ where: { sid: sessionIdFromCookie(cookie) } })

    const response = await request(app).get('/api/v1/auth/me').set('Cookie', cookie)
    expect(response.status).toBe(401)
    expect(response.body.code).toBe('UNAUTHORIZED')
  })

  it('issues a CSRF token on an anonymous session before sign-in (TSD 8.3)', async () => {
    const response = await request(app).get('/api/v1/auth/csrf-token')

    expect(response.status).toBe(200)
    expect(typeof response.body.data.csrfToken).toBe('string')
    const cookie = sessionCookie(response.headers)
    const row = await prisma.userSession.findUnique({ where: { sid: sessionIdFromCookie(cookie) } })
    expect(row).not.toBeNull()
    expect(await isAuthenticated(cookie)).toBe(false)

    await prisma.userSession.delete({ where: { sid: sessionIdFromCookie(cookie) } })
  })

  it('rejects sign-in without a valid CSRF token and creates no authenticated session (TSD 8.3)', async () => {
    const user = await createTestUser('login-csrf')
    const credentials = { email: user.email, password: TEST_PASSWORD }
    const anonymous = await fetchCsrfSession(app)
    const otherBrowser = await fetchCsrfSession(app)

    const withoutToken = await request(app).post('/api/v1/auth/login').send(credentials)
    const withoutTokenHeader = await request(app).post('/api/v1/auth/login').set('Cookie', anonymous.cookie).send(credentials)
    const withAnotherSessionsToken = await request(app)
      .post('/api/v1/auth/login')
      .set('Cookie', anonymous.cookie)
      .set('X-CSRF-Token', otherBrowser.csrfToken)
      .send(credentials)

    for (const response of [withoutToken, withoutTokenHeader, withAnotherSessionsToken]) {
      expect(response.status).toBe(403)
      expect(response.body.code).toBe('FORBIDDEN')
      expect(response.body).not.toHaveProperty('data')
    }
    expect(await isAuthenticated(anonymous.cookie)).toBe(false)
  })

  it('rotates the CSRF token on sign-in so the pre-login token stops working (TSD 8.1, 8.3)', async () => {
    const user = await createTestUser('csrf-rotate')
    const anonymous = await fetchCsrfSession(app)

    const response = await login(user.email, anonymous.cookie)
    const cookie = sessionCookie(response.headers)

    expect(response.status).toBe(200)
    expect(response.body.data.csrfToken).not.toBe(anonymous.csrfToken)
    const staleTokenLogout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', anonymous.csrfToken)
    expect(staleTokenLogout.status).toBe(403)
    expect(await isAuthenticated(cookie)).toBe(true)
  })

  it('rotates the session ID on login and discards the previous session (TSD 8.1)', async () => {
    const user = await createTestUser('rotate')
    const firstCookie = sessionCookie((await login(user.email)).headers)
    const secondCookie = sessionCookie((await login(user.email, firstCookie)).headers)

    expect(secondCookie).not.toBe('')
    expect(sessionIdFromCookie(secondCookie)).not.toBe(sessionIdFromCookie(firstCookie))
    const oldRow = await prisma.userSession.findUnique({ where: { sid: sessionIdFromCookie(firstCookie) } })
    expect(oldRow).toBeNull()
  })

  it('returns an identical generic error for unknown email and wrong password (AC02.03, AC02.04)', async () => {
    const user = await createTestUser('generic')
    const browser = await fetchCsrfSession(app)
    const unknown = await postLogin(app, { email: `nobody-${randomUUID()}@staffora.test`, password: TEST_PASSWORD }, browser.cookie)
    const wrong = await postLogin(app, { email: user.email, password: 'WrongPassword2026!' }, browser.cookie)

    expect(unknown.status).toBe(401)
    expect(wrong.status).toBe(401)
    expect(unknown.body.message).toBe(wrong.body.message)
    expect(unknown.body.code).toBe(wrong.body.code)
    // The anonymous session the browser holds is never upgraded by a failed sign-in.
    expect(await isAuthenticated(browser.cookie)).toBe(false)
  })

  it('requires the CSRF token to log out and keeps the session when it is missing (TSD 8.3)', async () => {
    const user = await createTestUser('csrf')
    const cookie = sessionCookie((await login(user.email)).headers)

    const rejected = await request(app).post('/api/v1/auth/logout').set('Cookie', cookie)
    expect(rejected.status).toBe(403)

    const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie)
    expect(me.status).toBe(200)
  })

  it('revokes the session row and clears the cookie on logout (AC03.03, AC03.04, BR03)', async () => {
    const user = await createTestUser('logout')
    const loginResponse = await login(user.email)
    const cookie = sessionCookie(loginResponse.headers)

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', loginResponse.body.data.csrfToken)

    expect(logout.status).toBe(204)
    expect(String(logout.headers['set-cookie'])).toMatch(/staffora\.sid=;.*Expires=Thu, 01 Jan 1970/)
    const row = await prisma.userSession.findUnique({ where: { sid: sessionIdFromCookie(cookie) } })
    expect(row).toBeNull()

    const replay = await request(app).get('/api/v1/auth/me').set('Cookie', cookie)
    expect(replay.status).toBe(401)
  })

  it('rejects sign-in and existing sessions once the account is deactivated (AC02.05, BR01)', async () => {
    const user = await createTestUser('inactive')
    const cookie = sessionCookie((await login(user.email)).headers)

    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } })

    const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie)
    expect(me.status).toBe(401)
    const row = await prisma.userSession.findUnique({ where: { sid: sessionIdFromCookie(cookie) } })
    expect(row).toBeNull()

    const browser = await fetchCsrfSession(app)
    const relogin = await login(user.email, browser.cookie)
    expect(relogin.status).toBe(401)
    expect(relogin.body.message).toBe('Invalid email or password.')
    expect(await isAuthenticated(browser.cookie)).toBe(false)
  })

  it('lets another account sign in from a browser still holding a revoked session cookie (AC02.01)', async () => {
    const deactivated = await createTestUser('stale')
    const active = await createTestUser('fresh')
    const staleCookie = sessionCookie((await login(deactivated.email)).headers)
    await prisma.user.update({ where: { id: deactivated.id }, data: { isActive: false } })

    const response = await login(active.email, staleCookie)

    expect(response.status).toBe(200)
    expect(response.body.data.user.id).toBe(active.id)
    const freshCookie = sessionCookie(response.headers)
    expect(sessionIdFromCookie(freshCookie)).not.toBe(sessionIdFromCookie(staleCookie))
    const staleRow = await prisma.userSession.findUnique({ where: { sid: sessionIdFromCookie(staleCookie) } })
    expect(staleRow).toBeNull()
  })

  it('rate limits repeated login attempts per IP and email (TSD 8.5)', async () => {
    const email = `us0101-ratelimit-${randomUUID()}@staffora.test`
    const browser = await fetchCsrfSession(app)
    const attempt = (): Promise<request.Response> =>
      postLogin(app, { email, password: 'WrongPassword2026!' }, browser.cookie)

    for (let index = 0; index < 5; index++) {
      expect((await attempt()).status).toBe(401)
    }
    const limited = await attempt()
    expect(limited.status).toBe(429)
    expect(limited.body.code).toBe('RATE_LIMITED')
  })
})
