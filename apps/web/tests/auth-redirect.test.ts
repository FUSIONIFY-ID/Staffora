import { afterEach, describe, expect, it, vi } from 'vitest'
import { getHomePath, isSafeRedirectPath, readRedirectFrom } from '../src/app/router/redirect.js'
import { apiClient, onUnauthorized } from '../src/api/client.js'

describe('post-login redirect helpers', () => {
  it('routes each role to its home page', () => {
    expect(getHomePath('EMPLOYEE')).toBe('/my-profile')
    expect(getHomePath('ADMIN')).toBe('/dashboard')
    expect(getHomePath('RESOURCE_MANAGER')).toBe('/dashboard')
  })

  it.each(['/capacity', '/projects/42?tab=staffing'])('accepts in-app path %s', (path) => {
    expect(isSafeRedirectPath(path)).toBe(true)
  })

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', '/login', 'capacity', 42, null])(
    'rejects unsafe redirect %s',
    (path) => {
      expect(isSafeRedirectPath(path)).toBe(false)
    },
  )

  it('reads `from` only from well-formed router state', () => {
    expect(readRedirectFrom({ from: '/capacity' })).toBe('/capacity')
    expect(readRedirectFrom({ from: '//evil.example' })).toBeNull()
    expect(readRedirectFrom(null)).toBeNull()
    expect(readRedirectFrom('from')).toBeNull()
  })
})

describe('apiClient 401 notification', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const unauthorized = () =>
    new Response(JSON.stringify({ message: 'Not authenticated.', code: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })

  it('notifies listeners when a data request loses the session', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => unauthorized())
    const listener = vi.fn()
    const unsubscribe = onUnauthorized(listener)

    await expect(apiClient('/employees')).rejects.toMatchObject({ status: 401 })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    await expect(apiClient('/employees')).rejects.toMatchObject({ status: 401 })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('does not treat a failed login or the session probe as session loss', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => unauthorized())
    const listener = vi.fn()
    const unsubscribe = onUnauthorized(listener)

    await expect(apiClient('/auth/login', { method: 'POST', body: '{}' })).rejects.toMatchObject({ status: 401 })
    await expect(apiClient('/auth/me')).rejects.toMatchObject({ status: 401 })
    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })
})
