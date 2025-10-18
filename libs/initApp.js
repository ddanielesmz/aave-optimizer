import { initQueueSystem } from './initQueueSystem.js';

// Flag per evitare inizializzazioni multiple
let initialized = false;

/**
 * Inizializza il sistema di code all'avvio dell'applicazione
 * Da chiamare una sola volta all'avvio
 */
export async function initializeApp() {
  if (initialized) {
    console.log('[InitApp] ⚠️ App già inizializzata');
    return;
  }

  console.log('[InitApp] 🚀 Inizializzazione applicazione...');

  try {
    // Inizializza sistema di code solo se abilitato
    if (process.env.QUEUE_ENABLED !== 'false') {
      console.log('[InitApp] ⚡ Inizializzazione sistema di code...');
      await initQueueSystem();
      console.log('[InitApp] ✅ Sistema di code inizializzato');
    } else {
      console.log('[InitApp] ⚠️ Sistema di code disabilitato');
    }

    initialized = true;
    console.log('[InitApp] ✅ Applicazione inizializzata');

  } catch (error) {
    console.error('[InitApp] ❌ Errore inizializzazione applicazione:', error);
    // Non bloccare l'avvio dell'app se il sistema di code fallisce
    initialized = true;
  }
}

/**
 * Verifica se l'app è stata inizializzata
 */
export function isAppInitialized() {
  return initialized;
}
