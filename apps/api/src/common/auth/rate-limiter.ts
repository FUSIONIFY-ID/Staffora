import type { RequestHandler } from 'express'
import { RateLimitError } from '../errors/app-error.js'

interface RateLimitRecord {
  timestamps: number[]
}

class MemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>()

  constructor(
    private windowMs: number,
    private maxRequests: number,
  ) {
    // Periodically prune stale entries
    setInterval(() => this.prune(), 60_000).unref()
  }

  public check(key: string): boolean {
    const now = Date.now()
    const record = this.store.get(key) ?? { timestamps: [] }
    // Filter timestamps within current sliding window
    const recent = record.timestamps.filter((ts) => now - ts < this.windowMs)

    if (recent.length >= this.maxRequests) {
      return false
    }

    recent.push(now)
    this.store.set(key, { timestamps: recent })
    return true
  }

  private prune() {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      const active = record.timestamps.filter((ts) => now - ts < this.windowMs)
      if (active.length === 0) {
        this.store.delete(key)
      } else {
        this.store.set(key, { timestamps: active })
      }
    }
  }
}

// Login limiter: 5 attempts per 15 minutes per IP + normalized email
const loginLimiter = new MemoryRateLimiter(15 * 60 * 1000, 5)

// Authenticated API limiter: 300 requests per minute per user
const authenticatedLimiter = new MemoryRateLimiter(60 * 1000, 300)

// Unauthenticated non-login API limiter: 100 requests per minute per IP
const unauthenticatedLimiter = new MemoryRateLimiter(60 * 1000, 100)

export const loginRateLimitMiddleware: RequestHandler = (req, _res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'ip-unknown'
  const email = (req.body?.email || '').trim().toLowerCase()
  const key = `login:${ip}:${email}`

  if (!loginLimiter.check(key)) {
    return next(new RateLimitError('Too many login attempts. Please try again after 15 minutes.'))
  }
  next()
}

export const generalRateLimitMiddleware: RequestHandler = (req, _res, next) => {
  if (req.user) {
    const key = `auth:${req.user.id}`
    if (!authenticatedLimiter.check(key)) {
      return next(new RateLimitError('API rate limit exceeded. Max 300 requests per minute.'))
    }
  } else {
    const ip = req.ip || req.socket.remoteAddress || 'ip-unknown'
    const key = `unauth:${ip}`
    if (!unauthenticatedLimiter.check(key)) {
      return next(new RateLimitError('API rate limit exceeded. Max 100 requests per minute.'))
    }
  }
  next()
}
