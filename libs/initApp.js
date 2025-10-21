import { initQueueSystem } from './initQueueSystem.js';
import alertMonitor from './alertMonitor.js';
import config from '@/config';

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
    // Inizializza sistema di code solo se abilitato e non in produzione
    if (process.env.QUEUE_ENABLED !== 'false' && process.env.NODE_ENV !== 'production') {
      console.log('[InitApp] ⚡ Inizializzazione sistema di code...');
      await initQueueSystem();
      console.log('[InitApp] ✅ Sistema di code inizializzato');
    } else {
      console.log('[InitApp] ⚠️ Sistema di code disabilitato (produzione o configurato)');
    }

    // Inizializza sistema di alert Telegram se abilitato
    if (config.telegram.enabled) {
      console.log('[InitApp] 🔔 Inizializzazione sistema di alert...');
      alertMonitor.start();
      console.log('[InitApp] ✅ Sistema di alert inizializzato');
    } else {
      console.log('[InitApp] ⚠️ Sistema di alert disabilitato (TELEGRAM_BOT_TOKEN non configurato)');
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
