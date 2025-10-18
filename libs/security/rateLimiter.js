import { NextResponse } from "next/server";

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // General API routes
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: "Troppe richieste, riprova più tardi"
  },
  // Sensitive routes (auth, payments)
  sensitive: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: "Limite richieste superato per questa operazione"
  },
  // Webhook routes
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    message: "Limite webhook superato"
  }
};

// In-memory store for rate limiting (in production, use Redis)
const requestCounts = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.firstRequest > data.windowMs) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiting middleware
 * @param {string} type - Type of rate limiting (general, sensitive, webhook)
 * @param {string} identifier - Unique identifier (IP, user ID, etc.)
 * @returns {boolean} - true if request is allowed, false if rate limited
 */
export function checkRateLimit(type = 'general', identifier) {
  const config = RATE_LIMIT_CONFIG[type];
  if (!config) {
    console.warn(`Unknown rate limit type: ${type}`);
    return true;
  }

  const key = `${type}:${identifier}`;
  const now = Date.now();
  
  if (!requestCounts.has(key)) {
    requestCounts.set(key, {
      count: 1,
      firstRequest: now,
      windowMs: config.windowMs
    });
    return true;
  }

  const data = requestCounts.get(key);
  
  // Reset window if expired
  if (now - data.firstRequest > config.windowMs) {
    requestCounts.set(key, {
      count: 1,
      firstRequest: now,
      windowMs: config.windowMs
    });
    return true;
  }

  // Check if limit exceeded
  if (data.count >= config.maxRequests) {
    return false;
  }

  // Increment counter
  data.count++;
  return true;
}

/**
 * Rate limiting middleware for Next.js API routes
 * @param {string} type - Rate limit type
 * @param {Function} getIdentifier - Function to get identifier from request
 */
export function withRateLimit(type = 'general', getIdentifier = (req) => {
  // Default: use IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
  return ip;
}) {
  return function(handler) {
    return async function(req, ...args) {
      const identifier = getIdentifier(req);
      
      if (!checkRateLimit(type, identifier)) {
        const config = RATE_LIMIT_CONFIG[type];
        return NextResponse.json(
          { error: config.message },
          { 
            status: 429,
            headers: {
              'Retry-After': '60',
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0'
            }
          }
        );
      }

      return handler(req, ...args);
    };
  };
}

/**
 * Get client IP address from request
 * @param {Request} req - Next.js request object
 * @returns {string} - Client IP address
 */
export function getClientIP(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return 'unknown';
}

export default {
  checkRateLimit,
  withRateLimit,
  getClientIP,
  RATE_LIMIT_CONFIG
};
