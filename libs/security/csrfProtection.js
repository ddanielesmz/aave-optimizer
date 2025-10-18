/**
 * Esempi di Utilizzo Protezione CSRF
 * 
 * Questo file mostra come utilizzare il sistema di protezione CSRF
 * nelle route sensibili del backend.
 */

// Questo file contiene esempi di utilizzo della protezione CSRF
// Le funzioni reali sono definite in un altro file

// ========================================
// ESEMPIO 1: Route per ottenere token CSRF
// ========================================

/**
 * Endpoint per ottenere un token CSRF
 * Chiamato dal frontend prima di fare richieste sensibili
 */
export async function GET(req) {
  return await generateCSRFTokenEndpoint(req);
}

// ========================================
// ESEMPIO 2: Route di login con protezione CSRF
// ========================================

// Esempio di route di login con protezione CSRF
const loginPOST = withCSRFProtection(['/api/auth/login'])(async (req) => {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    // Validazione input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email e password sono richiesti' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Logica di autenticazione qui
    // const user = await authenticateUser(email, password);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Login effettuato con successo',
        // user: { id: user.id, email: user.email }
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Errore login:', error);
    return new Response(
      JSON.stringify({ error: 'Errore durante il login' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ========================================
// ESEMPIO 3: Route di logout con protezione CSRF
// ========================================

// Esempio di route di logout con protezione CSRF
const logoutPOST = withCSRFProtection(['/api/auth/logout'])(async (req) => {
  try {
    // Logica di logout qui
    // await invalidateUserSession(req);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Logout effettuato con successo' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Errore logout:', error);
    return new Response(
      JSON.stringify({ error: 'Errore durante il logout' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ========================================
// ESEMPIO 4: Route di pagamento Stripe con protezione CSRF
// ========================================

// Esempio di route Stripe con protezione CSRF
const stripePOST = withCSRFProtection(['/api/stripe/create-checkout'])(async (req) => {
  try {
    const body = await req.json();
    const { priceId, mode, successUrl, cancelUrl } = body;
    
    // Validazione input
    if (!priceId || !mode || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Tutti i parametri sono richiesti' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Logica di creazione checkout Stripe qui
    // const checkoutUrl = await createStripeCheckout({ priceId, mode, successUrl, cancelUrl });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        checkoutUrl: 'https://checkout.stripe.com/...',
        message: 'Checkout creato con successo' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Errore creazione checkout:', error);
    return new Response(
      JSON.stringify({ error: 'Errore durante la creazione del checkout' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ========================================
// ESEMPIO 5: Route di aggiornamento profilo con protezione CSRF
// ========================================

export const PUT = withCSRFProtection(['/api/user/profile'])(async (req) => {
  try {
    const body = await req.json();
    const { name, email, bio } = body;
    
    // Validazione input
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Nome e email sono richiesti' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Logica di aggiornamento profilo qui
    // await updateUserProfile({ name, email, bio });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Profilo aggiornato con successo' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Errore aggiornamento profilo:', error);
    return new Response(
      JSON.stringify({ error: 'Errore durante l\'aggiornamento del profilo' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ========================================
// ESEMPIO 6: Route pubblica senza protezione CSRF
// ========================================

// Esempio di route pubblica senza protezione CSRF
async function publicGET(req) {
  // Questa route non ha protezione CSRF perché non è sensibile
  return new Response(
    JSON.stringify({ 
      message: 'Dati pubblici',
      timestamp: new Date().toISOString() 
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}

// ========================================
// ESEMPIO 7: Middleware personalizzato con CSRF
// ========================================

/**
 * Middleware personalizzato che combina autenticazione e CSRF
 */
export function withAuthAndCSRF(handler) {
  return withCSRFProtection(['/api/user', '/api/stripe', '/api/auth'])(async (req) => {
    // Verifica autenticazione qui
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Token di autenticazione mancante' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Il token CSRF è già verificato dal middleware CSRF
    return handler(req);
  });
}

// ========================================
// ESEMPIO 8: Gestione errori CSRF personalizzata
// ========================================

export function withCustomCSRFErrorHandling(handler) {
  return withCSRFProtection()(async (req) => {
    try {
      return await handler(req);
    } catch (error) {
      if (error.message.includes('CSRF')) {
        return new Response(
          JSON.stringify({ 
            error: 'Richiesta non autorizzata',
            code: 'CSRF_ERROR',
            message: 'Il token di sicurezza è mancante o non valido. Ricarica la pagina e riprova.'
          }),
          { 
            status: 403, 
            headers: { 
              'Content-Type': 'application/json',
              'X-CSRF-Required': 'true'
            }
          }
        );
      }
      throw error;
    }
  });
}

// ========================================
// ESEMPIO 9: Configurazione CSRF per ambiente di sviluppo
// ========================================

const isDevelopment = process.env.NODE_ENV === 'development';

export function withDevelopmentCSRF(handler) {
  if (isDevelopment) {
    // In sviluppo, logga le informazioni CSRF per debug
    return withCSRFProtection()(async (req) => {
      const token = getCSRFTokenFromRequest(req);
      console.log('🔒 CSRF Token ricevuto:', token ? 'Presente' : 'Mancante');
      console.log('🔒 Session ID:', req.headers.get('x-session-id'));
      console.log('🔒 User Agent:', req.headers.get('user-agent'));
      
      return await handler(req);
    });
  } else {
    // In produzione, usa protezione CSRF normale
    return withCSRFProtection()(handler);
  }
}

// ========================================
// ESEMPIO 10: Test della protezione CSRF
// ========================================

/**
 * Endpoint per testare la protezione CSRF
 * Utile per verificare che il sistema funzioni correttamente
 */
// Esempio di route di test con protezione CSRF
const testPOST = withCSRFProtection(['/api/test/csrf'])(async (req) => {
  const token = getCSRFTokenFromRequest(req);
  
  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Protezione CSRF funzionante',
      tokenReceived: !!token,
      config: {
        cookieName: CSRF_CONFIG.cookieName,
        headerName: CSRF_CONFIG.headerName,
        maxAge: CSRF_CONFIG.maxAge
      }
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
});

// ========================================
// PATTERN DI UTILIZZO COMUNI
// ========================================

/**
 * 1. Route sensibili che necessitano protezione CSRF:
 *    - /api/auth/login
 *    - /api/auth/logout
 *    - /api/auth/register
 *    - /api/stripe/create-checkout
 *    - /api/stripe/create-portal
 *    - /api/user/profile
 *    - /api/user/settings
 *    - /api/user/delete-account
 * 
 * 2. Route pubbliche che NON necessitano protezione CSRF:
 *    - /api/public/*
 *    - /api/stats
 *    - /api/health
 *    - GET requests (generalmente)
 * 
 * 3. Flusso tipico:
 *    a) Frontend chiama GET /api/csrf-token per ottenere token
 *    b) Frontend include token in header X-CSRF-Token o cookie
 *    c) Frontend fa richiesta POST/PUT/DELETE a route sensibile
 *    d) Backend verifica token CSRF automaticamente
 * 
 * 4. Gestione errori:
 *    - Token mancante: 403 con X-CSRF-Required: true
 *    - Token non valido: 403 con X-CSRF-Required: true
 *    - Token scaduto: 403 con X-CSRF-Required: true
 */