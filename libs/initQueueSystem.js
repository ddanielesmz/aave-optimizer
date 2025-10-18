import { initializeQueueSystem } from './queueManager.js';
import { getRedis } from './redis.js';

/**
 * Inizializza il sistema di code e Redis all'avvio dell'applicazione
 * Da chiamare nel file di configurazione principale o nel middleware
 */
export async function initQueueSystem() {
  try {
    console.log('[InitQueueSystem] 🚀 Inizializzazione sistema di code...');
    
    // Testa connessione Redis
    const redis = getRedis();
    await redis.ping();
    console.log('[InitQueueSystem] ✅ Connessione Redis verificata');
    
    // Inizializza sistema di code
    const queueManager = await initializeQueueSystem();
    console.log('[InitQueueSystem] ✅ Sistema di code inizializzato');
    
    return queueManager;
    
  } catch (error) {
    console.error('[InitQueueSystem] ❌ Errore inizializzazione sistema di code:', error);
    
    // In caso di errore, l'app può continuare senza il sistema di code
    // ma le performance saranno ridotte
    console.warn('[InitQueueSystem] ⚠️ Sistema di code non disponibile, continuando senza cache/queue');
    
    return null;
  }
}

/**
 * Verifica se il sistema di code è disponibile
 */
export async function isQueueSystemAvailable() {
  try {
    const redis = getRedis();
    await redis.ping();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Ottiene statistiche del sistema di code
 */
export async function getQueueSystemStats() {
  try {
    const { getQueueManager } = await import('./queueManager.js');
    const queueManager = getQueueManager();
    
    if (!queueManager.initialized) {
      return { error: 'Sistema di code non inizializzato' };
    }
    
    const stats = await queueManager.getAllQueueStats();
    const redis = getRedis();
    const redisInfo = await redis.info('memory');
    
    return {
      queues: stats,
      redis: {
        memory: redisInfo,
        connected: true
      },
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
