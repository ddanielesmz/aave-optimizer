import { z } from 'zod';

// Common validation schemas
export const schemas = {
  // Wallet address validation (Ethereum format)
  walletAddress: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Indirizzo wallet non valido')
    .transform(addr => addr.toLowerCase()),

  // Chain ID validation
  chainId: z.union([
    z.literal(1),   // Ethereum Mainnet
    z.literal(137), // Polygon
    z.literal(56),  // BSC
    z.literal(42161), // Arbitrum
    z.literal(10),   // Optimism
    z.literal(8453), // Base
    z.literal(250),  // Fantom
    z.literal(43114), // Avalanche
  ], { errorMap: () => ({ message: 'Chain ID non supportato' })}),

  // Email validation
  email: z.string()
    .email('Email non valida')
    .max(255, 'Email troppo lunga')
    .transform(email => email.toLowerCase().trim()),

  // Password validation
  password: z.string()
    .min(8, 'Password deve essere almeno 8 caratteri')
    .max(128, 'Password troppo lunga')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password deve contenere almeno una lettera minuscola, una maiuscola e un numero'),

  // Generic string sanitization
  sanitizedString: z.string()
    .max(1000, 'Stringa troppo lunga')
    .transform(str => str.trim().replace(/[<>\"'&]/g, '')),

  // Numeric ID validation
  numericId: z.string()
    .regex(/^\d+$/, 'ID deve essere numerico')
    .transform(id => parseInt(id, 10))
    .refine(id => id > 0, 'ID deve essere positivo'),

  // Amount validation (for crypto amounts)
  amount: z.string()
    .regex(/^\d+(\.\d+)?$/, 'Importo non valido')
    .transform(amount => parseFloat(amount))
    .refine(amount => amount > 0, 'Importo deve essere positivo')
    .refine(amount => amount <= 1e18, 'Importo troppo grande'),

  // Pagination validation
  pagination: z.object({
    page: z.string().optional().transform(val => {
      const page = parseInt(val || '1', 10);
      return Math.max(1, Math.min(page, 1000)); // Limit to 1000 pages
    }),
    limit: z.string().optional().transform(val => {
      const limit = parseInt(val || '10', 10);
      return Math.max(1, Math.min(limit, 100)); // Limit to 100 items per page
    })
  })
};

// Common validation patterns
export const patterns = {
  walletAddress: /^0x[a-fA-F0-9]{40}$/,
  chainId: /^(1|137|56|42161|10|8453|250|43114)$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  amount: /^\d+(\.\d+)?$/
};

/**
 * Sanitize input to prevent XSS and injection attacks
 * @param {any} input - Input to sanitize
 * @returns {any} - Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 1000); // Limit length
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      // Sanitize keys too
      const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '');
      if (cleanKey) {
        sanitized[cleanKey] = sanitizeInput(value);
      }
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Validate input against a schema
 * @param {any} input - Input to validate
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Object} - { success: boolean, data?: any, error?: string }
 */
export function validateInput(input, schema) {
  try {
    const sanitized = sanitizeInput(input);
    const result = schema.parse(sanitized);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => err.message).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Errore di validazione' };
  }
}

/**
 * Validate wallet address
 * @param {string} address - Wallet address to validate
 * @returns {boolean} - true if valid
 */
export function isValidWalletAddress(address) {
  return patterns.walletAddress.test(address);
}

/**
 * Validate chain ID
 * @param {string|number} chainId - Chain ID to validate
 * @returns {boolean} - true if valid
 */
export function isValidChainId(chainId) {
  return patterns.chainId.test(chainId.toString());
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - true if valid
 */
export function isValidEmail(email) {
  return patterns.email.test(email);
}

/**
 * Middleware for input validation
 * @param {Object} validationRules - Rules for validation
 * @returns {Function} - Middleware function
 */
export function withValidation(validationRules) {
  return function(handler) {
    return async function(req, ...args) {
      try {
        const body = await req.json();
        const validatedData = {};
        
        // Validate each field according to rules
        for (const [field, schema] of Object.entries(validationRules)) {
          const validation = validateInput(body[field], schema);
          if (!validation.success) {
            return new Response(
              JSON.stringify({ error: `Campo ${field}: ${validation.error}` }),
              { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
          validatedData[field] = validation.data;
        }
        
        // Add validated data to request
        req.validatedData = validatedData;
        
        return handler(req, ...args);
      } catch (error) {
        console.error('Validation error:', error);
        return new Response(
          JSON.stringify({ error: 'Errore nella validazione dei dati' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    };
  };
}

export default {
  schemas,
  patterns,
  sanitizeInput,
  validateInput,
  isValidWalletAddress,
  isValidChainId,
  isValidEmail,
  withValidation
};
