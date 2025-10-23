/**
 * Security Environment Configuration
 * 
 * This file defines the required environment variables for security features.
 * Add these variables to your .env.local file.
 */

export const SECURITY_ENV_VARS = {
  // JWT Configuration
  JWT_SECRET: {
    required: true,
    description: 'Secret key for JWT token signing (use NEXTAUTH_SECRET if not set)',
    example: 'your-super-secret-jwt-key-here',
    fallback: 'NEXTAUTH_SECRET'
  },

  // MongoDB Security
  MONGODB_URI: {
    required: true,
    description: 'MongoDB connection URI with TLS enabled',
    example: 'mongodb+srv://username:password@cluster.example.mongodb.net/database?retryWrites=true&w=majority&tls=true',
    validation: (uri) => uri.includes('ssl=true') || uri.includes('tls=true')
  },

  // Stripe Webhook Security
  STRIPE_WEBHOOK_SECRET: {
    required: true,
    description: 'Stripe webhook endpoint secret for signature verification',
    example: 'whsec_1234567890abcdef...',
    validation: (secret) => secret.startsWith('whsec_')
  },

  // Resend Webhook Security
  RESEND_WEBHOOK_SECRET: {
    required: false,
    description: 'Resend webhook secret for signature verification',
    example: 'your-resend-webhook-secret',
    validation: (secret) => secret && secret.length >= 32
  },

  // Rate Limiting (Redis - Optional)
  REDIS_URL: {
    required: false,
    description: 'Redis URL for distributed rate limiting (optional, uses in-memory by default)',
    example: 'redis://localhost:6379',
    validation: (url) => url && url.startsWith('redis://')
  },

  // CORS Configuration
  ALLOWED_ORIGINS: {
    required: false,
    description: 'Comma-separated list of allowed origins for CORS',
    example: 'https://yourdomain.com,https://app.yourdomain.com',
    validation: (origins) => {
      if (!origins) return true;
      return origins.split(',').every(origin => 
        origin.startsWith('https://') || origin.startsWith('http://localhost')
      );
    }
  },

  // Security Headers
  SECURITY_HEADERS_ENABLED: {
    required: false,
    description: 'Enable additional security headers (default: true)',
    example: 'true',
    validation: (value) => ['true', 'false'].includes(value)
  },

  // CSRF Configuration
  CSRF_SECRET: {
    required: false,
    description: 'Secret for CSRF token generation (uses JWT_SECRET if not set)',
    example: 'your-csrf-secret-key',
    fallback: 'JWT_SECRET'
  },

  // Logging Configuration
  SECURITY_LOGGING_ENABLED: {
    required: false,
    description: 'Enable security event logging (default: true)',
    example: 'true',
    validation: (value) => ['true', 'false'].includes(value)
  }
};

/**
 * Validate environment variables
 * @returns {Object} - Validation results
 */
export function validateSecurityEnv() {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    missing: [],
    invalid: []
  };

  for (const [varName, config] of Object.entries(SECURITY_ENV_VARS)) {
    const value = process.env[varName] || process.env[config.fallback];
    
    if (config.required && !value) {
      results.valid = false;
      results.missing.push(varName);
      results.errors.push(`${varName} è richiesto ma non configurato`);
    } else if (value && config.validation && !config.validation(value)) {
      results.valid = false;
      results.invalid.push(varName);
      results.errors.push(`${varName} ha un formato non valido`);
    } else if (!value && config.required === false) {
      results.warnings.push(`${varName} non configurato (opzionale)`);
    }
  }

  return results;
}

/**
 * Get security configuration from environment
 * @returns {Object} - Security configuration
 */
export function getSecurityConfig() {
  const config = {};

  // JWT Configuration
  config.jwt = {
    secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    accessTokenExpiry: 15 * 60, // 15 minutes
    refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 days
    issuer: 'defi-dashboard',
    audience: 'defi-dashboard-users'
  };

  // Rate Limiting Configuration
  config.rateLimiting = {
    enabled: true,
    redis: {
      url: process.env.REDIS_URL,
      enabled: !!process.env.REDIS_URL
    },
    limits: {
      general: { windowMs: 60000, maxRequests: 100 },
      sensitive: { windowMs: 60000, maxRequests: 10 },
      webhook: { windowMs: 60000, maxRequests: 50 }
    }
  };

  // CSRF Configuration
  config.csrf = {
    enabled: true,
    secret: process.env.CSRF_SECRET || config.jwt.secret,
    maxAge: 60 * 60 * 1000, // 1 hour
    cookieName: 'csrf-token',
    headerName: 'x-csrf-token'
  };

  // CORS Configuration
  config.cors = {
    enabled: true,
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-CSRF-Token']
  };

  // Security Headers
  config.headers = {
    enabled: process.env.SECURITY_HEADERS_ENABLED !== 'false',
    csp: {
      enabled: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'", 'https://api.stripe.com', 'https://api.resend.com'],
        'frame-src': ["'self'", 'https://js.stripe.com'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"]
      }
    }
  };

  // Logging Configuration
  config.logging = {
    enabled: process.env.SECURITY_LOGGING_ENABLED !== 'false',
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    includeStack: process.env.NODE_ENV === 'development'
  };

  // MongoDB Security
  config.mongodb = {
    uri: process.env.MONGODB_URI,
    tls: true,
    retryWrites: true,
    maxPoolSize: 10,
    minPoolSize: 2,
    maxRetryTime: 30000
  };

  // Webhook Security
  config.webhooks = {
    stripe: {
      secret: process.env.STRIPE_WEBHOOK_SECRET,
      enabled: !!process.env.STRIPE_WEBHOOK_SECRET
    },
    resend: {
      secret: process.env.RESEND_WEBHOOK_SECRET,
      enabled: !!process.env.RESEND_WEBHOOK_SECRET
    }
  };

  return config;
}

/**
 * Print security configuration status
 */
export function printSecurityStatus() {
  const validation = validateSecurityEnv();
  const config = getSecurityConfig();

  console.group('🔒 Security Configuration Status');
  
  if (validation.valid) {
    console.log('✅ Tutte le configurazioni di sicurezza sono valide');
  } else {
    console.log('❌ Configurazioni di sicurezza incomplete:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️ Avvisi:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  console.log('\n📋 Configurazione attiva:');
  console.log(`  - JWT: ${config.jwt.secret ? '✅ Configurato' : '❌ Non configurato'}`);
  console.log(`  - MongoDB TLS: ${config.mongodb.tls ? '✅ Abilitato' : '❌ Disabilitato'}`);
  console.log(`  - Rate Limiting: ${config.rateLimiting.enabled ? '✅ Abilitato' : '❌ Disabilitato'}`);
  console.log(`  - CSRF Protection: ${config.csrf.enabled ? '✅ Abilitato' : '❌ Disabilitato'}`);
  console.log(`  - Security Headers: ${config.headers.enabled ? '✅ Abilitato' : '❌ Disabilitato'}`);
  console.log(`  - Stripe Webhook: ${config.webhooks.stripe.enabled ? '✅ Configurato' : '❌ Non configurato'}`);
  console.log(`  - Resend Webhook: ${config.webhooks.resend.enabled ? '✅ Configurato' : '❌ Non configurato'}`);

  console.groupEnd();
}

export default {
  SECURITY_ENV_VARS,
  validateSecurityEnv,
  getSecurityConfig,
  printSecurityStatus
};
