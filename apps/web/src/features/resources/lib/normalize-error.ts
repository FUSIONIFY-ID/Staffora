import { ApiError } from '../../../api/client.js'

export interface NormalizedError {
  message: string
  fieldErrors?: Record<string, string[]>
  isForbidden: boolean
}

const FALLBACK_MESSAGE = 'The request could not be completed. Please try again.'

// Prefers the backend message and field errors; falls back for network failures.
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
