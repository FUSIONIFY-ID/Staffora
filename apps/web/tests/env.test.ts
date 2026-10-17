import { describe, it, expect } from 'vitest'
import { validateEnv } from '../src/lib/validation/env.js'

describe('Environment Validation (validateEnv)', () => {
  it('succeeds with default values when rawEnv has empty or missing values', () => {
    const config = validateEnv({})
    expect(config.VITE_API_BASE_URL).toBe('/api/v1')
  })

  it('correctly accepts a custom base URL', () => {
    const config = validateEnv({ VITE_API_BASE_URL: 'http://localhost:3000/api/v1' })
    expect(config.VITE_API_BASE_URL).toBe('http://localhost:3000/api/v1')
  })

  it('throws an error with descriptive message when validation fails', () => {
    expect(() => validateEnv({ VITE_API_BASE_URL: '' })).toThrowError(
      /Staffora Environment Validation Error/,
    )
  })
})
