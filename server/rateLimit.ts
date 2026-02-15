/**
 * Simple in-memory rate limiting for contact form submissions
 * Prevents spam by limiting requests per IP address
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 requests per hour

/**
 * Cleanup expired entries every 10 minutes
 */
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}, 10 * 60 * 1000);

/**
 * Check if a request should be rate-limited
 * @param identifier - Unique identifier (e.g., IP address)
 * @returns Object with allowed status and remaining attempts
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry or expired entry - create new
  if (!entry || entry.resetAt < now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetAt,
    };
  }

  // Entry exists and is still valid
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count += 1;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP address from request headers
 * Handles proxies and load balancers
 */
export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
  // Check common proxy headers
  const forwardedFor = headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  const realIp = headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to remote address (not available in tRPC context, will use 'unknown')
  return 'unknown';
}

/**
 * Format time remaining until rate limit reset
 */
export function formatResetTime(resetAt: number): string {
  const now = Date.now();
  const diff = resetAt - now;
  
  if (diff <= 0) return '0 Minuten';
  
  const minutes = Math.ceil(diff / (60 * 1000));
  if (minutes < 60) return `${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} Stunde${hours !== 1 ? 'n' : ''}`;
  }
  
  return `${hours} Stunde${hours !== 1 ? 'n' : ''} und ${remainingMinutes} Minute${remainingMinutes !== 1 ? 'n' : ''}`;
}
