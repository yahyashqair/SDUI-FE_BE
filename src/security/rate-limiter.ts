/**
 * Rate Limiter
 * Implements token bucket algorithm for rate limiting
 */

interface RateLimitEntry {
    tokens: number;
    lastRefill: number;
}

interface RateLimitConfig {
    maxTokens: number;          // Maximum tokens in bucket
    refillRate: number;         // Tokens added per second
    refillInterval: number;     // Interval in ms to check refill
}

const DEFAULT_CONFIG: RateLimitConfig = {
    maxTokens: 100,
    refillRate: 10,
    refillInterval: 1000
};

export class RateLimiter {
    private buckets: Map<string, RateLimitEntry> = new Map();
    private config: RateLimitConfig;
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;

    constructor(config: Partial<RateLimitConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.startCleanup();
    }

    /**
     * Check if a request is allowed and consume a token
     */
    isAllowed(key: string, tokensRequired: number = 1): boolean {
        const now = Date.now();
        let entry = this.buckets.get(key);

        if (!entry) {
            entry = {
                tokens: this.config.maxTokens,
                lastRefill: now
            };
            this.buckets.set(key, entry);
        }

        // Refill tokens based on time passed
        const timePassed = (now - entry.lastRefill) / 1000;
        const tokensToAdd = Math.floor(timePassed * this.config.refillRate);
        
        if (tokensToAdd > 0) {
            entry.tokens = Math.min(this.config.maxTokens, entry.tokens + tokensToAdd);
            entry.lastRefill = now;
        }

        // Check if enough tokens available
        if (entry.tokens >= tokensRequired) {
            entry.tokens -= tokensRequired;
            return true;
        }

        return false;
    }

    /**
     * Get remaining tokens for a key
     */
    getRemaining(key: string): number {
        const entry = this.buckets.get(key);
        if (!entry) return this.config.maxTokens;

        // Calculate refill
        const now = Date.now();
        const timePassed = (now - entry.lastRefill) / 1000;
        const tokensToAdd = Math.floor(timePassed * this.config.refillRate);
        
        return Math.min(this.config.maxTokens, entry.tokens + tokensToAdd);
    }

    /**
     * Get time until next token is available (in ms)
     */
    getRetryAfter(key: string): number {
        const remaining = this.getRemaining(key);
        if (remaining >= 1) return 0;

        return Math.ceil((1 - remaining) / this.config.refillRate * 1000);
    }

    /**
     * Reset rate limit for a key
     */
    reset(key: string): void {
        this.buckets.delete(key);
    }

    /**
     * Clear all rate limits
     */
    clear(): void {
        this.buckets.clear();
    }

    /**
     * Start periodic cleanup of stale entries
     */
    private startCleanup(): void {
        const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
        const MAX_IDLE_TIME = 10 * 60 * 1000; // 10 minutes

        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.buckets.entries()) {
                if (now - entry.lastRefill > MAX_IDLE_TIME) {
                    this.buckets.delete(key);
                }
            }
        }, CLEANUP_INTERVAL);
    }

    /**
     * Stop the cleanup interval
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================

/**
 * API rate limiter - 100 requests per minute
 */
export const apiRateLimiter = new RateLimiter({
    maxTokens: 100,
    refillRate: 100 / 60, // 100 per minute
    refillInterval: 1000
});

/**
 * AI rate limiter - 10 requests per minute (more expensive)
 */
export const aiRateLimiter = new RateLimiter({
    maxTokens: 10,
    refillRate: 10 / 60, // 10 per minute
    refillInterval: 1000
});

/**
 * Auth rate limiter - 5 attempts per minute (prevent brute force)
 */
export const authRateLimiter = new RateLimiter({
    maxTokens: 5,
    refillRate: 5 / 60, // 5 per minute
    refillInterval: 1000
});

/**
 * Function deployment rate limiter - 20 per hour
 */
export const deployRateLimiter = new RateLimiter({
    maxTokens: 20,
    refillRate: 20 / 3600, // 20 per hour
    refillInterval: 1000
});

// ============================================================================
// Middleware Helpers
// ============================================================================

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(
    limiter: RateLimiter,
    key: string
): Record<string, string> {
    const remaining = limiter.getRemaining(key);
    const retryAfter = limiter.getRetryAfter(key);

    return {
        'X-RateLimit-Remaining': String(Math.floor(remaining)),
        'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000 + retryAfter / 1000)),
        ...(retryAfter > 0 ? { 'Retry-After': String(Math.ceil(retryAfter / 1000)) } : {})
    };
}

/**
 * Check rate limit and return response if exceeded
 */
export function checkRateLimit(
    limiter: RateLimiter,
    key: string,
    tokensRequired: number = 1
): Response | null {
    if (!limiter.isAllowed(key, tokensRequired)) {
        const headers = createRateLimitHeaders(limiter, key);
        return new Response(
            JSON.stringify({ 
                error: 'Rate limit exceeded',
                retryAfter: headers['Retry-After']
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            }
        );
    }
    return null;
}

/**
 * Get rate limit key from request
 */
export function getRateLimitKey(request: Request, prefix: string = ''): string {
    // Try to get real IP from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';
    
    return `${prefix}:${ip}`;
}
