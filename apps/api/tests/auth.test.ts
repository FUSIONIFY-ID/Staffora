import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'

describe('Authentication & Session Baseline (EP01 & TSD Section 8)', () => {
  const app = createApp({ useMemorySession: true })

  it('rejects invalid login credentials with a generic error (AC02.03, AC02.04)', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@staffora.internal', password: 'WrongPassword123!' })

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('UNAUTHORIZED')
    expect(response.body.message).toBe('Invalid email or password.')
  })

  it('rejects missing fields with 422 validation error (AC01.05)', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({})
    expect(response.status).toBe(422)
    expect(response.body.code).toBe('UNPROCESSABLE_ENTITY')
  })

  it('authenticates valid credentials, sets session cookie, and returns user identity (AC02.01, TSD 8.1)', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@staffora.internal', password: 'StafforaAdmin2026!' })

    expect(loginRes.status).toBe(200)
    expect(loginRes.body.data.user.email).toBe('admin@staffora.internal')
    expect(loginRes.body.data.user.role).toBe('ADMIN')
    expect(loginRes.body.data.csrfToken).toBeDefined()

    const cookies = loginRes.headers['set-cookie']
    expect(cookies).toBeDefined()
    const cookieHeader = cookies?.[0] ?? ''
    expect(cookieHeader).toContain('staffora.sid')

    // Access /api/v1/auth/me with session cookie
    const meRes = await request(app).get('/api/v1/auth/me').set('Cookie', cookieHeader)
    expect(meRes.status).toBe(200)
    expect(meRes.body.data.email).toBe('admin@staffora.internal')

    // Fetch CSRF token
    const csrfRes = await request(app).get('/api/v1/auth/csrf-token').set('Cookie', cookieHeader)
    expect(csrfRes.status).toBe(200)
    expect(csrfRes.body.data.csrfToken).toBeDefined()

    // Logout destroys session
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookieHeader)
      .set('X-CSRF-Token', loginRes.body.data.csrfToken)
    expect(logoutRes.status).toBe(204)

    // After logout, accessing protected route returns 401 (AC03.04)
    const afterLogout = await request(app).get('/api/v1/auth/me').set('Cookie', cookieHeader)
    expect(afterLogout.status).toBe(401)
  })
})
