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
})
