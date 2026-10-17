import { ApiError } from '../../api/client.js'

export const GENERIC_LOGIN_ERROR = 'Invalid email or password.'

/**
 * Maps a failed sign-in to user-facing copy. Every 401 shows the same generic message,
 * even when the backend explains why (e.g. an inactive account), so the login form
 * never reveals whether an account exists or is active.
 */
export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 422) return GENERIC_LOGIN_ERROR
    if (error.status === 429) return 'Too many sign-in attempts. Please wait a few minutes and try again.'
  }
  return 'Unable to sign in right now. Please try again shortly.'
}
