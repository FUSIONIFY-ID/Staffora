import type React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '../src/app/providers/auth-provider.js'
import { ProtectedRoute } from '../src/app/router/protected-route.js'
import { PublicRoute } from '../src/app/router/public-route.js'
import { LoginPage } from '../src/features/auth/login-page.js'
import { apiClient, getCachedCsrfToken, setCachedCsrfToken } from '../src/api/client.js'

const adminUser = { id: 'u1', email: 'admin@staffora.internal', role: 'ADMIN', isActive: true }
const employeeUser = { id: 'u2', email: 'employee@staffora.internal', role: 'EMPLOYEE', isActive: true }

type Responder = (url: string, init?: RequestInit) => Response

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function mockApi(responder: Responder) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => responder(String(input), init))
}

const unauthenticated = (status = 401) => json(status, { message: 'Not authenticated.', code: 'UNAUTHORIZED' })

const ProbeData: React.FC = () => {
  const query = useQuery({ queryKey: ['employees'], queryFn: () => apiClient<{ data: string }>('/employees') })
  return <div>{query.isError ? 'Data request failed' : 'Capacity page'}</div>
}

const LogoutButton: React.FC = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => void logout().then(() => navigate('/login'))}>
      Sign out
    </button>
  )
}

function renderApp(initialPath: string, queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/capacity" element={<ProtectedRoute allowedRoles={['ADMIN']}><ProbeData /><LogoutButton /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><div>Dashboard home</div></ProtectedRoute>} />
            <Route path="/my-profile" element={<ProtectedRoute><div>My profile home</div></ProtectedRoute>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
  return queryClient
}

beforeEach(() => {
  setCachedCsrfToken(null)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Auth session flow (US01.01, US01.02)', () => {
  it('sends a guest to login, then back to the requested page after sign-in', async () => {
    let signedIn = false
    mockApi((url, init) => {
      if (url.endsWith('/auth/me')) return signedIn ? json(200, { data: adminUser }) : unauthenticated()
      if (url.endsWith('/auth/csrf-token')) return unauthenticated()
      if (url.endsWith('/auth/login') && init?.method === 'POST') {
        signedIn = true
        return json(200, { data: { user: adminUser, csrfToken: 'csrf-1' } })
      }
      if (url.endsWith('/employees')) return json(200, { data: 'ok' })
      return json(404, { message: 'Not found', code: 'NOT_FOUND' })
    })

    renderApp('/capacity')

    expect(await screen.findByText('Please sign in to continue.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Work email'), { target: { value: 'admin@staffora.internal' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Capacity page')).toBeInTheDocument()
    expect(getCachedCsrfToken()).toBe('csrf-1')
  })

  it('sends a signed-in user to the role home page when no redirect is pending', async () => {
    mockApi((url) => (url.endsWith('/auth/me') ? json(200, { data: employeeUser }) : unauthenticated()))

    renderApp('/login')

    expect(await screen.findByText('My profile home')).toBeInTheDocument()
  })

  it('shows 403 for a role without access instead of an empty page', async () => {
    mockApi((url) => (url.endsWith('/auth/me') ? json(200, { data: employeeUser }) : unauthenticated()))

    renderApp('/capacity')

    expect(await screen.findByTestId('forbidden-state')).toBeInTheDocument()
    expect(screen.queryByText('Capacity page')).not.toBeInTheDocument()
  })

  it('recovers from a mid-session 401 by signing out in-app and clearing cached data', async () => {
    mockApi((url) => {
      if (url.endsWith('/auth/me')) return json(200, { data: adminUser })
      if (url.endsWith('/employees')) return unauthenticated()
      return unauthenticated()
    })
    setCachedCsrfToken('stale-token')

    const queryClient = renderApp('/capacity')

    expect(await screen.findByText('Please sign in to continue.')).toBeInTheDocument()
    expect(getCachedCsrfToken()).toBeNull()
    expect(queryClient.getQueryData(['employees'])).toBeUndefined()
  })

  it('logs out with the CSRF token, clears the session and cache, and lands on login', async () => {
    const fetchSpy = mockApi((url, init) => {
      if (url.endsWith('/auth/me')) return json(200, { data: adminUser })
      if (url.endsWith('/auth/logout') && init?.method === 'POST') return new Response(null, { status: 204 })
      if (url.endsWith('/employees')) return json(200, { data: 'ok' })
      return unauthenticated()
    })
    setCachedCsrfToken('csrf-logout')

    const queryClient = renderApp('/capacity')
    expect(await screen.findByText('Capacity page')).toBeInTheDocument()
    await waitFor(() => expect(queryClient.getQueryData(['employees'])).toEqual({ data: 'ok' }))

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    // Both the route guard and the button navigate to /login, so wait for the settled page.
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument())
    const logoutCall = fetchSpy.mock.calls.find(([url]) => String(url).endsWith('/auth/logout'))
    expect(new Headers(logoutCall?.[1]?.headers).get('X-CSRF-Token')).toBe('csrf-logout')
    expect(getCachedCsrfToken()).toBeNull()
    expect(queryClient.getQueryData(['employees'])).toBeUndefined()
  })
})
