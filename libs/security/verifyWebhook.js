import crypto from 'crypto';

/**
 * Verify Stripe webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @param {string} secret - Stripe webhook secret
 * @returns {Object} - { valid: boolean, error?: string }
 */
export function verifyStripeWebhook(payload, signature, secret) {
  try {
    if (!signature) {
      return { valid: false, error: 'Firma Stripe mancante' };
    }

    if (!secret) {
      return { valid: false, error: 'Webhook secret Stripe non configurato' };
    }

    // Parse signature header
    const elements = signature.split(',');
    const signatureData = {};
    
    for (const element of elements) {
      const [key, value] = element.split('=');
      signatureData[key] = value;
    }

    const timestamp = signatureData.t;
    const v1 = signatureData.v1;

    if (!timestamp || !v1) {
      return { valid: false, error: 'Formato firma Stripe non valido' };
    }

    // Check timestamp (prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(timestamp, 10);
    const timeDifference = Math.abs(currentTime - webhookTime);

    if (timeDifference > 300) { // 5 minutes tolerance
      return { valid: false, error: 'Timestamp webhook troppo vecchio' };
    }

    // Create expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    // Compare signatures using timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(v1, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValid) {
      return { valid: false, error: 'Firma Stripe non valida' };
    }

    return { valid: true };
  } catch (error) {
    console.error('Errore verifica webhook Stripe:', error);
    return { valid: false, error: 'Errore nella verifica della firma Stripe' };
  }
}

/**
 * Verify Resend webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Resend signature header
 * @param {string} secret - Resend webhook secret
 * @returns {Object} - { valid: boolean, error?: string }
 */
export function verifyResendWebhook(payload, signature, secret) {
  try {
    if (!signature) {
      return { valid: false, error: 'Firma Resend mancante' };
    }

    if (!secret) {
      return { valid: false, error: 'Webhook secret Resend non configurato' };
    }

    // Resend uses HMAC-SHA256 with the payload
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    // Compare signatures using timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValid) {
      return { valid: false, error: 'Firma Resend non valida' };
    }

    return { valid: true };
  } catch (error) {
    console.error('Errore verifica webhook Resend:', error);
    return { valid: false, error: 'Errore nella verifica della firma Resend' };
  }
}

/**
 * Generic webhook signature verification
 * @param {string} payload - Raw request body
 * @param {string} signature - Signature header
 * @param {string} secret - Webhook secret
 * @param {string} algorithm - Hash algorithm (default: sha256)
 * @returns {Object} - { valid: boolean, error?: string }
 */
export function verifyGenericWebhook(payload, signature, secret, algorithm = 'sha256') {
  try {
    if (!signature) {
      return { valid: false, error: 'Firma webhook mancante' };
    }

    if (!secret) {
      return { valid: false, error: 'Webhook secret non configurato' };
    }

    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payload, 'utf8')
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValid) {
      return { valid: false, error: 'Firma webhook non valida' };
    }

    return { valid: true };
  } catch (error) {
    console.error('Errore verifica webhook generico:', error);
    return { valid: false, error: 'Errore nella verifica della firma webhook' };
  }
}

/**
 * Extract signature from request headers
 * @param {Request} req - Next.js request object
 * @param {string} headerName - Header name (default: 'stripe-signature')
 * @returns {string|null} - Signature or null
 */
export function getWebhookSignature(req, headerName = 'stripe-signature') {
  return req.headers.get(headerName);
}

/**
 * Get raw request body for webhook verification
 * @param {Request} req - Next.js request object
 * @returns {Promise<string>} - Raw body as string
 */
export async function getRawBody(req) {
  try {
    const buffer = await req.arrayBuffer();
    return Buffer.from(buffer).toString('utf8');
  } catch (error) {
    console.error('Errore lettura body webhook:', error);
    throw new Error('Impossibile leggere il body della richiesta');
  }
}

/**
 * Webhook verification middleware for Stripe
 * @param {Function} handler - API route handler
 * @returns {Function} - Protected handler
 */
export function withStripeWebhookVerification(handler) {
  return async function(req, ...args) {
    try {
      const signature = getWebhookSignature(req, 'stripe-signature');
      const payload = await getRawBody(req);
      const secret = process.env.STRIPE_WEBHOOK_SECRET;

      const verification = verifyStripeWebhook(payload, signature, secret);

      if (!verification.valid) {
        console.warn('Webhook Stripe non verificato:', verification.error);
        return new Response(
          JSON.stringify({ error: verification.error }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Add verified payload to request
      req.webhookPayload = JSON.parse(payload);
      req.webhookVerified = true;

      return handler(req, ...args);
    } catch (error) {
      console.error('Errore middleware webhook Stripe:', error);
      return new Response(
        JSON.stringify({ error: 'Errore nella verifica del webhook' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Webhook verification middleware for Resend
 * @param {Function} handler - API route handler
 * @returns {Function} - Protected handler
 */
export function withResendWebhookVerification(handler) {
  return async function(req, ...args) {
    try {
      const signature = getWebhookSignature(req, 'resend-signature');
      const payload = await getRawBody(req);
      const secret = process.env.RESEND_WEBHOOK_SECRET;

      const verification = verifyResendWebhook(payload, signature, secret);

      if (!verification.valid) {
        console.warn('Webhook Resend non verificato:', verification.error);
        return new Response(
          JSON.stringify({ error: verification.error }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Add verified payload to request
      req.webhookPayload = JSON.parse(payload);
      req.webhookVerified = true;

      return handler(req, ...args);
    } catch (error) {
      console.error('Errore middleware webhook Resend:', error);
      return new Response(
        JSON.stringify({ error: 'Errore nella verifica del webhook' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Generic webhook verification middleware
 * @param {string} secretEnvVar - Environment variable name for secret
 * @param {string} signatureHeader - Header name for signature
 * @param {string} algorithm - Hash algorithm
 * @returns {Function} - Middleware factory
 */
export function withGenericWebhookVerification(secretEnvVar, signatureHeader = 'x-webhook-signature', algorithm = 'sha256') {
  return function(handler) {
    return async function(req, ...args) {
      try {
        const signature = getWebhookSignature(req, signatureHeader);
        const payload = await getRawBody(req);
        const secret = process.env[secretEnvVar];

        const verification = verifyGenericWebhook(payload, signature, secret, algorithm);

        if (!verification.valid) {
          console.warn('Webhook non verificato:', verification.error);
          return new Response(
            JSON.stringify({ error: verification.error }),
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        // Add verified payload to request
        req.webhookPayload = JSON.parse(payload);
        req.webhookVerified = true;

        return handler(req, ...args);
      } catch (error) {
        console.error('Errore middleware webhook generico:', error);
        return new Response(
          JSON.stringify({ error: 'Errore nella verifica del webhook' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    };
  };
}

/**
 * Validate webhook event type
 * @param {Object} payload - Webhook payload
 * @param {Array<string>} allowedTypes - Allowed event types
 * @returns {boolean} - true if event type is allowed
 */
export function validateWebhookEventType(payload, allowedTypes) {
  const eventType = payload.type || payload.event_type || payload.event;
  return allowedTypes.includes(eventType);
}

export default {
  verifyStripeWebhook,
  verifyResendWebhook,
  verifyGenericWebhook,
  getWebhookSignature,
  getRawBody,
  withStripeWebhookVerification,
  withResendWebhookVerification,
  withGenericWebhookVerification,
  validateWebhookEventType
};
