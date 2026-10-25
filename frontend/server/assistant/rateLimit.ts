export interface RateLimitRule {
  windowMs: number
  max: number
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number }

export interface RateLimiter {
  check(key: string, now?: number): RateLimitResult
}

/**
 * A sliding-window limiter held in memory. It protects one running instance of the endpoint. On a
 * platform that runs several instances (Cloudflare Workers, serverless functions) each keeps its
 * own counts, so before making the assistant public also set the platform's own rate limiting and
 * a monthly spend cap on the AI account (OPEN_DECISIONS D-14). This interface lets such a limiter
 * replace this one without touching the handler.
 */
export function createMemoryRateLimiter(
  rules: readonly RateLimitRule[],
  options: { maxKeys?: number } = {},
): RateLimiter {
  const maxKeys = options.maxKeys ?? 5000
  const longest = Math.max(...rules.map((rule) => rule.windowMs))
  const hits = new Map<string, number[]>()

  return {
    check(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((time) => now - time < longest)

      let wait = 0
      for (const rule of rules) {
        const inWindow = recent.filter((time) => now - time < rule.windowMs)
        if (inWindow.length >= rule.max) {
          // The oldest hit in this window leaves it after windowMs.
          const oldest = inWindow[0] ?? now
          wait = Math.max(wait, oldest + rule.windowMs - now)
        }
      }
      if (wait > 0) {
        hits.set(key, recent)
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(wait / 1000)) }
      }

      recent.push(now)
      // Delete and re-insert so the map stays ordered by recency, then drop the stalest keys.
      hits.delete(key)
      hits.set(key, recent)
      while (hits.size > maxKeys) {
        const stalest = hits.keys().next().value
        if (stalest === undefined) break
        hits.delete(stalest)
      }
      return { allowed: true }
    },
  }
}
