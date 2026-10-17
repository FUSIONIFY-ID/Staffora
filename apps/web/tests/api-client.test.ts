import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  apiClient,
  ApiError,
  setCachedCsrfToken,
  getCachedCsrfToken,
  buildApiUrl,
} from '../src/api/client.js'

describe('API Client Foundation', () => {
  beforeEach(() => {
    setCachedCsrfToken('mock-csrf-token')
    vi.restoreAllMocks()
  })

  it('builds relative endpoints with API prefix', () => {
    const url = buildApiUrl('/employees')
    expect(url).toContain('/employees')
  })

  it('keeps full URL untouched', () => {
    const url = buildApiUrl('https://api.external.com/status')
    expect(url).toBe('https://api.external.com/status')
  })

  it('handles successful GET responses', async () => {
    const mockData = { data: { id: '1', name: 'John Doe' } }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockData,
    } as Response)

    const res = await apiClient<{ data: { id: string; name: string } }>('/test')
    expect(res).toEqual(mockData)
  })

  it('handles 204 No Content responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
    } as Response)

    const res = await apiClient<void>('/delete-test', { method: 'DELETE' })
    expect(res).toBeNull()
  })

  it('normalizes API error responses and preserves code, errors, and metadata', async () => {
    const errorPayload = {
      message: 'Employee capacity exceeded',
      code: 'CAPACITY_CONFLICT',
      errors: { allocation: ['Cannot allocate 120%'] },
      meta: { currentAllocation: 100, attempted: 20 },
      requestId: 'req-abc-123',
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => errorPayload,
    } as Response)

    await expect(apiClient('/allocations', { method: 'POST' })).rejects.toThrowError(ApiError)

    try {
      await apiClient('/allocations', { method: 'POST' })
    } catch (err) {
      if (err instanceof ApiError) {
        expect(err.status).toBe(409)
        expect(err.code).toBe('CAPACITY_CONFLICT')
        expect(err.errors).toEqual(errorPayload.errors)
        expect(err.meta).toEqual(errorPayload.meta)
        expect(err.requestId).toBe('req-abc-123')
      }
    }
  })

  it('attaches CSRF token to mutation requests', async () => {
    setCachedCsrfToken('test-token-123')
    expect(getCachedCsrfToken()).toBe('test-token-123')

    let requestedHeaders: Headers | undefined

    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
      requestedHeaders = new Headers(init?.headers)
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      } as Response
    })

    await apiClient('/test-mutation', { method: 'POST', body: JSON.stringify({ a: 1 }) })

    expect(requestedHeaders?.get('X-CSRF-Token')).toBe('test-token-123')
  })
})
