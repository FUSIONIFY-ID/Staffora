import { describe, expect, it } from 'vitest'
import { loadEnv } from '../src/config/env.js'

describe('environment validation (Zod)', () => {
  it('loads valid environment variables with defaults', () => {
    const env = loadEnv({
      NODE_ENV: 'test',
    })
    expect(env.NODE_ENV).toBe('test')
    expect(env.PORT).toBe(3000)
  })

  it('coerces and parses PORT number without unsafe casting', () => {
    const env = loadEnv({
      NODE_ENV: 'development',
      PORT: '8080',
    })
    expect(env.PORT).toBe(8080)
  })

  it('rejects invalid DATABASE_URL schemes and malformed URLs', () => {
    expect(() => {
      loadEnv({
        NODE_ENV: 'development',
        DATABASE_URL: 'mysql://localhost:3306/staffora',
      })
    }).toThrow()

    expect(() => {
      loadEnv({
        NODE_ENV: 'development',
        DATABASE_URL: 'not-a-valid-url',
      })
    }).toThrow()
  })

  it('rejects SESSION_SECRET shorter than 32 characters', () => {
    expect(() => {
      loadEnv({
        NODE_ENV: 'development',
        SESSION_SECRET: 'short-secret-under-32-chars',
      })
    }).toThrow()
  })

  it('fails if production environment lacks DATABASE_URL or SESSION_SECRET', () => {
    expect(() => {
      loadEnv({
        NODE_ENV: 'production',
      })
    }).toThrow()

    expect(() => {
      loadEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/staffora',
      })
    }).toThrow()

    const validProd = loadEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/staffora',
      SESSION_SECRET: 'super-secret-key-that-is-at-least-32-chars-long!',
    })
    expect(validProd.NODE_ENV).toBe('production')
    expect(validProd.DATABASE_URL).toBe('postgresql://postgres:postgres@localhost:5432/staffora')
  })
})
