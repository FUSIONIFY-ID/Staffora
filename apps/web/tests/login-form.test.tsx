import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from '../src/features/auth/login-page.js'
import { getLoginErrorMessage } from '../src/features/auth/login-error.js'
import { ApiError } from '../src/api/client.js'
import * as AuthContextModule from '../src/app/providers/auth-provider.js'

function renderLogin(login: AuthContextModule.AuthContextType['login'], state?: unknown) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: null,
    isLoading: false,
    login,
    logout: vi.fn(),
    refresh: vi.fn(),
  })
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Work email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LoginForm validation (AC01.05)', () => {
  it('blocks submission and shows field errors when fields are empty', async () => {
    const login = vi.fn()
    renderLogin(login)

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Work email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(screen.getByLabelText('Work email')).toHaveAttribute('aria-invalid', 'true')
    expect(login).not.toHaveBeenCalled()
  })

  it('rejects a malformed email', async () => {
    const login = vi.fn()
    renderLogin(login)

    fillAndSubmit('not-an-email', 'whatever')

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })
})

describe('LoginForm submission', () => {
  it('submits trimmed credentials and shows a loading state while pending', async () => {
    let resolveLogin: (value: never) => void = () => undefined
    const login = vi.fn(() => new Promise<never>((resolve) => (resolveLogin = resolve)))
    renderLogin(login)

    fillAndSubmit('  admin@staffora.internal ', 'secret-password')

    await waitFor(() => expect(login).toHaveBeenCalledWith('admin@staffora.internal', 'secret-password'))
    const submit = screen.getByRole('button', { name: /Signing in/ })
    expect(submit).toBeDisabled()
    expect(screen.getByLabelText('Work email')).toBeDisabled()
    resolveLogin(undefined as never)
  })

  it('shows the generic message even when the backend reveals an inactive account (AC02.03, AC02.05)', async () => {
    const login = vi.fn().mockRejectedValue(
      new ApiError(401, { message: 'User account is inactive.', code: 'UNAUTHORIZED' }),
    )
    renderLogin(login)

    fillAndSubmit('inactive@staffora.internal', 'secret-password')

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
    expect(screen.queryByText(/inactive/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })

  it('renders the design copy with a masked password (AC01.04)', () => {
    renderLogin(vi.fn())

    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByText('Sign in to continue to Staffora')).toBeInTheDocument()
    expect(screen.getByText('Right People. Right Project.')).toBeInTheDocument()
    expect(screen.getByText(/Authorized users only/)).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })

  it('explains why the user landed on login after a redirect', () => {
    renderLogin(vi.fn(), { from: '/capacity' })
    expect(screen.getByText('Please sign in to continue.')).toBeInTheDocument()
  })
})

describe('getLoginErrorMessage', () => {
  it.each([
    [new ApiError(401, { message: 'x', code: 'UNAUTHORIZED' }), 'Invalid email or password.'],
    [new ApiError(422, { message: 'x', code: 'UNPROCESSABLE_ENTITY' }), 'Invalid email or password.'],
    [new ApiError(429, { message: 'x', code: 'TOO_MANY_REQUESTS' }), /Too many sign-in attempts/],
    [new ApiError(500, { message: 'db down', code: 'INTERNAL' }), /Unable to sign in right now/],
    [new TypeError('Failed to fetch'), /Unable to sign in right now/],
  ])('maps %s', (error, expected) => {
    expect(getLoginErrorMessage(error)).toMatch(expected)
  })
})
