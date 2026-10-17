import { apiClient, ApiError } from '../../api/client.js'
import type { UserProfile } from '../../types/auth.js'

export const AUTH_ME_QUERY_KEY = ['auth', 'me'] as const

export interface LoginResult {
  user: UserProfile
  csrfToken: string
}

/** Resolves to `null` when there is no valid session (HTTP 401) instead of throwing. */
export async function fetchCurrentUser(): Promise<UserProfile | null> {
  try {
    const res = await apiClient<{ data: UserProfile }>('/auth/me')
    return res.data
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export async function loginRequest(email: string, password: string): Promise<LoginResult> {
  const res = await apiClient<{ data: LoginResult }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return res.data
}

export async function logoutRequest(): Promise<void> {
  await apiClient<null>('/auth/logout', { method: 'POST' })
}
