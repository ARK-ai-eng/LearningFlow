// Simple in-memory rate limiting for login attempts
// Max 5 attempts per 15 minutes per IP

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number; // Timestamp
  blockedUntil?: number; // Timestamp
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Cleanup old entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((entry, ip) => {
    if (entry.blockedUntil && entry.blockedUntil < now) {
      rateLimitMap.delete(ip);
    } else if (!entry.blockedUntil && now - entry.firstAttempt > WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  });
}, WINDOW_MS);

export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts?: number; blockedUntil?: Date } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    // First attempt
    rateLimitMap.set(ip, { attempts: 1, firstAttempt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Check if blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      blockedUntil: new Date(entry.blockedUntil),
    };
  }

  // Reset if window expired
  if (now - entry.firstAttempt > WINDOW_MS) {
    rateLimitMap.set(ip, { attempts: 1, firstAttempt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Increment attempts
  entry.attempts++;

  if (entry.attempts > MAX_ATTEMPTS) {
    // Block for 15 minutes
    entry.blockedUntil = now + BLOCK_DURATION_MS;
    return {
      allowed: false,
      blockedUntil: new Date(entry.blockedUntil),
    };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - entry.attempts };
}

export function resetRateLimit(ip: string) {
  rateLimitMap.delete(ip);
}
