import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

// Mock limiter that always allows requests if Redis is not configured
const mockLimiter = {
    limit: async () => ({ success: true, limit: 0, remaining: 0, reset: 0 }),
}

export const chatRatelimit = hasRedis
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 requests per minute
        analytics: true,
    })
    : mockLimiter

export const audioRatelimit = hasRedis
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 audio requests per minute
        analytics: true,
    })
    : mockLimiter
