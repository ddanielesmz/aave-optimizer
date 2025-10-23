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
    description: 'MongoDB connection URI with TLS enabled (format: mongodb+srv://[credentials]@cluster.mongodb.net/database?retryWrites=true&w=majority&tls=true)',
    example: 'Set your MongoDB Atlas connection string here',
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
    refreshTokenExpiry: 24 * 60 * 60, // Ridotto da 7 giorni a 1 giorno
    issuer: 'defi-dashboard',
    audience: 'defi-dashboard-users',
    algorithm: 'HS256', // Specificato algoritmo
    clockTolerance: 30 // 30 secondi di tolleranza
  };

  // Rate Limiting Configuration
  config.rateLimiting = {
    enabled: true,
    redis: {
      url: process.env.REDIS_URL,
      enabled: !!process.env.REDIS_URL
    },
    limits: {
      general: { windowMs: 60000, maxRequests: 60 }, // Ridotto da 100 a 60
      sensitive: { windowMs: 60000, maxRequests: 5 }, // Ridotto da 10 a 5
      webhook: { windowMs: 60000, maxRequests: 30 }, // Ridotto da 50 a 30
      auth: { windowMs: 60000, maxRequests: 3 }, // Nuovo limite per auth
      api: { windowMs: 60000, maxRequests: 20 } // Nuovo limite per API
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
    origins: process.env.ALLOWED_ORIGINS?.split(',') || (process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    maxAge: 86400, // 24 ore cache per preflight
    optionsSuccessStatus: 200
  };

  // Security Headers
  config.headers = {
    enabled: process.env.SECURITY_HEADERS_ENABLED !== 'false',
    csp: {
      enabled: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'nonce-{random}'", "https://js.stripe.com", "https://connect.facebook.net"],
        'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        'img-src': ["'self'", 'data:', 'https:', 'blob:'],
        'font-src': ["'self'", "https://fonts.gstatic.com"],
        'connect-src': ["'self'", 'https://api.stripe.com', 'https://api.resend.com', 'https://api.telegram.org', 'wss:', 'ws:'],
        'frame-src': ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'", 'https://checkout.stripe.com'],
        'upgrade-insecure-requests': [],
        'block-all-mixed-content': []
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
    maxRetryTime: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxIdleTimeMS: 30000,
    authSource: 'admin' // Specifica source di autenticazione
  };

  // Webhook Security
  config.webhooks = {
    stripe: {
      secret: process.env.STRIPE_WEBHOOK_SECRET,
      enabled: !!process.env.STRIPE_WEBHOOK_SECRET,
      tolerance: 300 // 5 minuti di tolleranza timestamp
    },
    resend: {
      secret: process.env.RESEND_WEBHOOK_SECRET,
      enabled: !!process.env.RESEND_WEBHOOK_SECRET
    }
  };

  // Additional Security Features
  config.security = {
    // Password requirements
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAttempts: 5,
      lockoutDuration: 15 * 60 * 1000 // 15 minuti
    },
    
    // Session security
    session: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 ore
    },
    
    // Input validation
    inputValidation: {
      maxStringLength: 1000,
      maxArrayLength: 100,
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
      maxFileSize: 5 * 1024 * 1024 // 5MB
    },
    
    // Brute force protection
    bruteForce: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minuti
      blockDuration: 30 * 60 * 1000 // 30 minuti
    }
  };

  return config;
}

/**
 * Generate secure CSP nonce
 * @returns {string} - Random nonce for CSP
 */
export function generateCSPNonce() {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Validate security configuration
 * @returns {Object} - Validation results with security score
 */
export function validateSecurityConfiguration() {
  const config = getSecurityConfig();
  const validation = validateSecurityEnv();
  
  let securityScore = 0;
  const maxScore = 100;
  const issues = [];
  const recommendations = [];
  
  // Check JWT configuration (20 points)
  if (config.jwt.secret && config.jwt.secret.length >= 32) {
    securityScore += 20;
  } else {
    issues.push('JWT secret troppo debole o mancante');
    recommendations.push('Usa un secret di almeno 32 caratteri');
  }
  
  // Check MongoDB TLS (15 points)
  if (config.mongodb.tls) {
    securityScore += 15;
  } else {
    issues.push('MongoDB TLS non abilitato');
    recommendations.push('Abilita TLS per MongoDB');
  }
  
  // Check CSP configuration (20 points)
  if (config.headers.csp.enabled && !config.headers.csp.directives['script-src'].includes("'unsafe-eval'")) {
    securityScore += 20;
  } else {
    issues.push('CSP non configurato correttamente');
    recommendations.push('Rimuovi unsafe-eval e unsafe-inline');
  }
  
  // Check rate limiting (15 points)
  if (config.rateLimiting.enabled && config.rateLimiting.limits.sensitive.maxRequests <= 10) {
    securityScore += 15;
  } else {
    issues.push('Rate limiting troppo permissivo');
    recommendations.push('Riduci i limiti per API sensibili');
  }
  
  // Check CORS (10 points)
  if (config.cors.origins.length > 0 && !config.cors.origins.includes('*')) {
    securityScore += 10;
  } else {
    issues.push('CORS troppo permissivo');
    recommendations.push('Specifica origini esplicite');
  }
  
  // Check webhook security (10 points)
  if (config.webhooks.stripe.enabled || config.webhooks.resend.enabled) {
    securityScore += 10;
  } else {
    recommendations.push('Configura webhook secrets per maggiore sicurezza');
  }
  
  // Check environment validation (10 points)
  if (validation.valid) {
    securityScore += 10;
  } else {
    issues.push('Variabili d\'ambiente non configurate correttamente');
    recommendations.push('Configura tutte le variabili richieste');
  }
  
  return {
    score: securityScore,
    maxScore,
    percentage: Math.round((securityScore / maxScore) * 100),
    issues,
    recommendations,
    config: config,
    validation: validation
  };
}

/**
 * Print security configuration status
 */
export function printSecurityStatus() {
  const securityValidation = validateSecurityConfiguration();
  const validation = validateSecurityEnv();
  const config = getSecurityConfig();

  console.group('🔒 Security Configuration Status');
  
  // Security Score
  const scoreColor = securityValidation.percentage >= 80 ? '🟢' : 
                    securityValidation.percentage >= 60 ? '🟡' : '🔴';
  console.log(`${scoreColor} Security Score: ${securityValidation.percentage}% (${securityValidation.score}/${securityValidation.maxScore})`);
  
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

  if (securityValidation.issues.length > 0) {
    console.log('🚨 Problemi di sicurezza:');
    securityValidation.issues.forEach(issue => console.error(`  - ${issue}`));
  }

  if (securityValidation.recommendations.length > 0) {
    console.log('💡 Raccomandazioni:');
    securityValidation.recommendations.forEach(rec => console.warn(`  - ${rec}`));
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
  printSecurityStatus,
  generateCSPNonce,
  validateSecurityConfiguration
};
