import type { Role } from '../../constants/roles.js'

/** Router state set by ProtectedRoute when it sends an unauthenticated user to /login. */
export interface LoginRedirectState {
  from: string
}

export function getHomePath(role: Role): string {
  return role === 'EMPLOYEE' ? '/my-profile' : '/dashboard'
}

/** Accepts only same-origin app paths so `from` cannot be abused as an open redirect. */
export function isSafeRedirectPath(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.startsWith('/\\') &&
    !path.startsWith('/login')
  )
}

export function readRedirectFrom(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('from' in state)) return null
  const { from } = state
  return isSafeRedirectPath(from) ? from : null
}
