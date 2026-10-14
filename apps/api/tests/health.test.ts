import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'

describe('infrastructure health endpoints (TSD 14.3)', () => {
  const app = createApp({ useMemorySession: true })

  it('GET /api/v1/health/live returns process status ok', async () => {
    const response = await request(app).get('/api/v1/health/live')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.body.timestamp).toBeDefined()
  })

  it('GET /api/v1/health/ready returns database readiness', async () => {
    const response = await request(app).get('/api/v1/health/ready')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ready')
    expect(response.body.database).toBe('connected')
  })

  it('GET /api/v1/health returns ok for backward compatibility', async () => {
    const response = await request(app).get('/api/v1/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })

  it('returns standard error shape with requestId for non-existent route (global 404)', async () => {
    const response = await request(app).get('/api/v1/non-existent-route')
    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty('message')
    expect(response.body).toHaveProperty('code', 'NOT_FOUND')
    expect(response.body).toHaveProperty('errors')
    expect(response.body).toHaveProperty('meta')
    expect(response.body).toHaveProperty('requestId')
    expect(response.headers['x-request-id']).toBeDefined()
  })

  it('propagates caller provided X-Request-Id header', async () => {
    const customId = 'c8290a61-12ec-4ea5-8946-b25ef898f80f'
    const response = await request(app)
      .get('/api/v1/health/live')
      .set('X-Request-Id', customId)
    expect(response.status).toBe(200)
    expect(response.headers['x-request-id']).toBe(customId)
  })
})

