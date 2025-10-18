import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// JWT configuration
const JWT_CONFIG = {
  accessTokenExpiry: 15 * 60, // 15 minutes
  refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 days
  issuer: 'defi-dashboard',
  audience: 'defi-dashboard-users',
  algorithm: 'HS256'
};

// In-memory store for refresh tokens (in production, use Redis)
const refreshTokens = new Map();
const revokedTokens = new Set();

// Clean up expired tokens every hour
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  
  // Clean up expired refresh tokens
  for (const [token, data] of refreshTokens.entries()) {
    if (data.expiresAt < now) {
      refreshTokens.delete(token);
    }
  }
  
  // Clean up revoked tokens older than 24 hours
  const revokedArray = Array.from(revokedTokens);
  revokedArray.forEach(token => {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp < now - 24 * 60 * 60) {
        revokedTokens.delete(token);
      }
    } catch (error) {
      // Remove invalid tokens
      revokedTokens.delete(token);
    }
  });
}, 60 * 60 * 1000);

/**
 * Get JWT secret from environment
 * @returns {string} - JWT secret
 */
function getJWTSecret() {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET non configurato');
  }
  return secret;
}

/**
 * Generate access token
 * @param {Object} payload - Token payload
 * @returns {string} - Access token
 */
export function generateAccessToken(payload) {
  const secret = getJWTSecret();
  
  const tokenPayload = {
    ...payload,
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + JWT_CONFIG.accessTokenExpiry,
    iss: JWT_CONFIG.issuer,
    aud: JWT_CONFIG.audience,
    jti: crypto.randomUUID() // Unique token ID for revocation
  };
  
  return jwt.sign(tokenPayload, secret, { algorithm: JWT_CONFIG.algorithm });
}

/**
 * Generate refresh token
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns {Object} - { token, expiresAt }
 */
export function generateRefreshToken(userId, sessionId) {
  const secret = getJWTSecret();
  const expiresAt = Math.floor(Date.now() / 1000) + JWT_CONFIG.refreshTokenExpiry;
  
  const tokenPayload = {
    type: 'refresh',
    userId,
    sessionId,
    iat: Math.floor(Date.now() / 1000),
    exp: expiresAt,
    iss: JWT_CONFIG.issuer,
    aud: JWT_CONFIG.audience,
    jti: crypto.randomUUID()
  };
  
  const token = jwt.sign(tokenPayload, secret, { algorithm: JWT_CONFIG.algorithm });
  
  // Store refresh token
  refreshTokens.set(token, {
    userId,
    sessionId,
    expiresAt,
    createdAt: Date.now(),
    lastUsed: null
  });
  
  return { token, expiresAt };
}

/**
 * Verify access token
 * @param {string} token - Token to verify
 * @returns {Object} - { valid: boolean, payload?: Object, error?: string }
 */
export function verifyAccessToken(token) {
  try {
    const secret = getJWTSecret();
    
    // Check if token is revoked
    if (revokedTokens.has(token)) {
      return { valid: false, error: 'Token revocato' };
    }
    
    const payload = jwt.verify(token, secret, {
      algorithms: [JWT_CONFIG.algorithm],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });
    
    // Verify token type
    if (payload.type !== 'access') {
      return { valid: false, error: 'Tipo di token non valido' };
    }
    
    return { valid: true, payload };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token scaduto' };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Token non valido' };
    } else {
      return { valid: false, error: 'Errore nella verifica del token' };
    }
  }
}

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} - { valid: boolean, payload?: Object, error?: string }
 */
export function verifyRefreshToken(token) {
  try {
    const secret = getJWTSecret();
    
    // Check if token exists in store
    const tokenData = refreshTokens.get(token);
    if (!tokenData) {
      return { valid: false, error: 'Refresh token non trovato' };
    }
    
    // Check if token is expired
    if (tokenData.expiresAt < Math.floor(Date.now() / 1000)) {
      refreshTokens.delete(token);
      return { valid: false, error: 'Refresh token scaduto' };
    }
    
    const payload = jwt.verify(token, secret, {
      algorithms: [JWT_CONFIG.algorithm],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });
    
    // Verify token type
    if (payload.type !== 'refresh') {
      return { valid: false, error: 'Tipo di token non valido' };
    }
    
    // Update last used timestamp
    tokenData.lastUsed = Date.now();
    refreshTokens.set(token, tokenData);
    
    return { valid: true, payload };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      refreshTokens.delete(token);
      return { valid: false, error: 'Refresh token scaduto' };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Refresh token non valido' };
    } else {
      return { valid: false, error: 'Errore nella verifica del refresh token' };
    }
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @param {Object} additionalPayload - Additional data to include in new token
 * @returns {Object} - { success: boolean, accessToken?: string, refreshToken?: string, error?: string }
 */
export function refreshAccessToken(refreshToken, additionalPayload = {}) {
  const verification = verifyRefreshToken(refreshToken);
  
  if (!verification.valid) {
    return { success: false, error: verification.error };
  }
  
  const payload = verification.payload;
  
  // Generate new access token
  const newAccessToken = generateAccessToken({
    userId: payload.userId,
    sessionId: payload.sessionId,
    ...additionalPayload
  });
  
  // Optionally rotate refresh token (security best practice)
  const shouldRotate = Math.random() < 0.1; // 10% chance to rotate
  
  if (shouldRotate) {
    // Revoke old refresh token
    refreshTokens.delete(refreshToken);
    
    // Generate new refresh token
    const newRefreshToken = generateRefreshToken(payload.userId, payload.sessionId);
    
    return {
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken.token,
      expiresAt: newRefreshToken.expiresAt
    };
  }
  
  return {
    success: true,
    accessToken: newAccessToken
  };
}

/**
 * Revoke token (logout)
 * @param {string} token - Token to revoke
 * @param {string} userId - User ID (optional, for cleanup)
 */
export function revokeToken(token, userId = null) {
  // Add to revoked tokens set
  revokedTokens.add(token);
  
  // Remove from refresh tokens if it exists
  refreshTokens.delete(token);
  
  // If userId provided, revoke all tokens for that user
  if (userId) {
    for (const [refreshToken, data] of refreshTokens.entries()) {
      if (data.userId === userId) {
        refreshTokens.delete(refreshToken);
        revokedTokens.add(refreshToken);
      }
    }
  }
}

/**
 * Revoke all tokens for a user
 * @param {string} userId - User ID
 */
export function revokeAllUserTokens(userId) {
  for (const [refreshToken, data] of refreshTokens.entries()) {
    if (data.userId === userId) {
      refreshTokens.delete(refreshToken);
      revokedTokens.add(refreshToken);
    }
  }
}

/**
 * Get token from request headers
 * @param {Request} req - Next.js request object
 * @returns {string|null} - Token or null
 */
export function getTokenFromRequest(req) {
  const authHeader = req.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * JWT authentication middleware
 * @param {Function} handler - API route handler
 * @returns {Function} - Protected handler
 */
export function withJWTAuth(handler) {
  return async function(req, ...args) {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token di accesso mancante' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const verification = verifyAccessToken(token);
    
    if (!verification.valid) {
      return new Response(
        JSON.stringify({ error: verification.error }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Add user info to request
    req.user = verification.payload;
    
    return handler(req, ...args);
  };
}

/**
 * Optional JWT authentication middleware (doesn't fail if no token)
 * @param {Function} handler - API route handler
 * @returns {Function} - Handler with optional auth
 */
export function withOptionalJWTAuth(handler) {
  return async function(req, ...args) {
    const token = getTokenFromRequest(req);
    
    if (token) {
      const verification = verifyAccessToken(token);
      if (verification.valid) {
        req.user = verification.payload;
      }
    }
    
    return handler(req, ...args);
  };
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAccessToken,
  revokeToken,
  revokeAllUserTokens,
  getTokenFromRequest,
  withJWTAuth,
  withOptionalJWTAuth,
  JWT_CONFIG
};
