import { withRateLimit, getClientIP } from './rateLimiter.js';
import { withValidation, schemas } from './validateInput.js';
// import { withCSRFProtection } from './csrfProtection.js'; // Temporaneamente disabilitato
import { withJWTAuth, withOptionalJWTAuth } from './jwtSecurity.js';
import { withStripeWebhookVerification, withResendWebhookVerification } from './verifyWebhook.js';

/**
 * Security middleware configuration
 */
export const SECURITY_CONFIG = {
  // Rate limiting settings
  rateLimits: {
    general: 'general',
    sensitive: 'sensitive',
    webhook: 'webhook'
  },
  
  // CSRF protection routes
  csrfRoutes: [
    '/api/auth',
    '/api/stripe',
    '/api/user/profile',
    '/api/user/settings'
  ],
  
  // JWT protected routes
  jwtRoutes: [
    '/api/dashboard',
    '/api/user',
    '/api/transactions',
    '/api/portfolio'
  ],
  
  // Optional JWT routes (auth recommended but not required)
  optionalJwtRoutes: [
    '/api/public',
    '/api/stats'
  ]
};

/**
 * Comprehensive security middleware factory
 * @param {Object} options - Security options
 * @returns {Function} - Middleware function
 */
export function withSecurity(options = {}) {
  const {
    rateLimit = 'general',
    validation = null,
    csrf = false,
    jwt = false,
    optionalJwt = false,
    webhook = null // 'stripe', 'resend', or custom config
  } = options;

  return function(handler) {
    let middleware = handler;

    // Apply webhook verification first (if specified)
    if (webhook === 'stripe') {
      middleware = withStripeWebhookVerification(middleware);
    } else if (webhook === 'resend') {
      middleware = withResendWebhookVerification(middleware);
    }

    // Apply JWT authentication
    if (jwt) {
      middleware = withJWTAuth(middleware);
    } else if (optionalJwt) {
      middleware = withOptionalJWTAuth(middleware);
    }

    // Apply CSRF protection (temporaneamente disabilitato)
    // if (csrf) {
    //   middleware = withCSRFProtection(SECURITY_CONFIG.csrfRoutes)(middleware);
    // }

    // Apply input validation
    if (validation) {
      middleware = withValidation(validation)(middleware);
    }

    // Apply rate limiting last
    middleware = withRateLimit(rateLimit, getClientIP)(middleware);

    return middleware;
  };
}

/**
 * Pre-configured security middleware for common use cases
 */
export const securityMiddleware = {
  // Public API routes (rate limiting only)
  public: withSecurity({ rateLimit: 'general' }),
  
  // Authenticated routes (JWT + rate limiting)
  authenticated: withSecurity({ 
    jwt: true, 
    rateLimit: 'general' 
  }),
  
  // Sensitive routes (JWT + CSRF + strict rate limiting)
  sensitive: withSecurity({ 
    jwt: true, 
    csrf: true, 
    rateLimit: 'sensitive' 
  }),
  
  // Webhook routes (webhook verification + rate limiting)
  stripeWebhook: withSecurity({ 
    webhook: 'stripe', 
    rateLimit: 'webhook' 
  }),
  
  resendWebhook: withSecurity({ 
    webhook: 'resend', 
    rateLimit: 'webhook' 
  }),
  
  // Optional authentication routes
  optionalAuth: withSecurity({ 
    optionalJwt: true, 
    rateLimit: 'general' 
  })
};

/**
 * Common validation schemas for API routes
 */
export const commonValidations = {
  // Wallet operations
  walletOperation: {
    address: schemas.walletAddress,
    chainId: schemas.chainId,
    amount: schemas.amount.optional()
  },
  
  // User profile updates
  userProfile: {
    name: schemas.sanitizedString.max(100),
    email: schemas.email,
    bio: schemas.sanitizedString.max(500).optional()
  },
  
  // Pagination
  pagination: schemas.pagination,
  
  // Generic ID parameter
  idParam: {
    id: schemas.numericId
  },
  
  // Search parameters
  search: {
    query: schemas.sanitizedString.max(100),
    ...schemas.pagination.shape
  }
};

/**
 * Security headers middleware
 * @param {Function} handler - API route handler
 * @returns {Function} - Handler with security headers
 */
export function withSecurityHeaders(handler) {
  return async function(req, ...args) {
    const response = await handler(req, ...args);
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.stripe.com https://api.resend.com",
      "frame-src 'self' https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', csp);
    
    return response;
  };
}

/**
 * Request logging middleware
 * @param {Function} handler - API route handler
 * @returns {Function} - Handler with request logging
 */
export function withRequestLogging(handler) {
  return async function(req, ...args) {
    const startTime = Date.now();
    const ip = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const method = req.method;
    const url = req.url;
    
    console.log(`📥 ${method} ${url} - IP: ${ip} - UA: ${userAgent.substring(0, 50)}...`);
    
    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - startTime;
      
      console.log(`📤 ${method} ${url} - ${response.status} - ${duration}ms`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${method} ${url} - ERROR - ${duration}ms:`, error.message);
      throw error;
    }
  };
}

/**
 * Error handling middleware
 * @param {Function} handler - API route handler
 * @returns {Function} - Handler with error handling
 */
export function withErrorHandling(handler) {
  return async function(req, ...args) {
    try {
      return await handler(req, ...args);
    } catch (error) {
      console.error('API Error:', error);
      
      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      const message = isDevelopment ? error.message : 'Errore interno del server';
      
      return new Response(
        JSON.stringify({ 
          error: message,
          ...(isDevelopment && { stack: error.stack })
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Complete security middleware stack
 * @param {Object} options - Security options
 * @returns {Function} - Complete middleware stack
 */
export function withCompleteSecurity(options = {}) {
  const {
    security = {},
    logging = true,
    errorHandling = true
  } = options;

  return function(handler) {
    let middleware = handler;

    // Apply security middleware
    middleware = withSecurity(security)(middleware);

    // Apply security headers
    middleware = withSecurityHeaders(middleware);

    // Apply request logging
    if (logging) {
      middleware = withRequestLogging(middleware);
    }

    // Apply error handling
    if (errorHandling) {
      middleware = withErrorHandling(middleware);
    }

    return middleware;
  };
}

export default {
  withSecurity,
  securityMiddleware,
  commonValidations,
  withSecurityHeaders,
  withRequestLogging,
  withErrorHandling,
  withCompleteSecurity,
  SECURITY_CONFIG
};
