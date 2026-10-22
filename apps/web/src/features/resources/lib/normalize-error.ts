import { ApiError } from '../../../api/client.js'

export interface NormalizedError {
  /** Human sentence safe to show in a banner. */
  message: string
  /** Per-field messages from a 400/409 response, keyed by API field name. */
  fieldErrors?: Record<string, string[]>
  /** True for 403, so callers can render an authorization-specific surface. */
  isForbidden: boolean
}

const FALLBACK_MESSAGE = 'The request could not be completed. Please try again.'

/**
 * Reduces any thrown value into a displayable error.
 *
 * `ApiError` carries the backend's `message` and optional `errors` map, so the
 * banner shows the real reason (for example a duplicate employee code) instead
 * of a generic string. Non-API failures — network drops, aborted requests — get
 * a neutral fallback because their message is not user-facing.
 */
export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof ApiError) {
    return {
      message: error.message || FALLBACK_MESSAGE,
      fieldErrors: Object.keys(error.errors).length > 0 ? error.errors : undefined,
      isForbidden: error.status === 403,
    }
  }

  if (error instanceof Error && error.message) {
    return { message: error.message, isForbidden: false }
  }

  return { message: FALLBACK_MESSAGE, isForbidden: false }
}
