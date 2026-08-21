// lib/rate-limit.ts
import 'server-only'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of buckets) {
      if (entry.resetAt < now) {
        buckets.delete(key)
      }
    }
  }, 5 * 60 * 1000).unref?.()
}

interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  max: number
  /** Window duration in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Simple in-memory rate limiter.
 * Suitable for a single-server deployment.
 * For multi-server, use Redis or Upstash.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now()
  const entry = buckets.get(identifier)

  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + options.windowMs,
    }
    buckets.set(identifier, newEntry)
    return { allowed: true, remaining: options.max - 1, resetAt: newEntry.resetAt }
  }

  if (entry.count >= options.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: options.max - entry.count, resetAt: entry.resetAt }
}

/** Get client IP from request headers */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

/** Rate limit presets from Plan 02 */
export const RATE_LIMITS = {
  leads: { max: 5, windowMs: 60 * 60 * 1000 }, // 5 leads per hour per IP
  quote: { max: 50, windowMs: 60 * 60 * 1000 }, // 50 quotes per hour per IP
} as const
