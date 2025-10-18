import { 
  getQueue, 
  getWorker, 
  getQueueEvents, 
  QUEUE_NAMES, 
  QUEUE_CONFIGS,
  JobManager 
} from './queue.js';

// Esporta QUEUE_NAMES per uso esterno
export { QUEUE_NAMES };
import { 
  processAaveHealthUpdate, 
  processBulkAaveHealthUpdate,
  processCacheCleanup 
} from './jobs/aaveHealthJob.js';
import { 
  processAaveMarketDataUpdate, 
  processBulkAaveMarketDataUpdate,
  processAPYOptimization 
} from './jobs/aaveMarketJob.js';

/**
 * Manager centrale per tutte le code e worker del sistema
 */
export class QueueManager {
  constructor() {
    this.initialized = false;
    this.jobManagers = new Map();
  }

  /**
   * Inizializza tutte le code e worker
   */
  async initialize() {
    if (this.initialized) {
      console.log('[QueueManager] ⚠️ Già inizializzato');
      return;
    }

    console.log('[QueueManager] 🚀 Inizializzazione code e worker...');

    try {
      // Inizializza code
      await this.initializeQueues();
      
      // Inizializza worker
      await this.initializeWorkers();
      
      // Inizializza job ricorrenti
      await this.initializeRecurringJobs();
      
      this.initialized = true;
      console.log('[QueueManager] ✅ Inizializzazione completata');
      
    } catch (error) {
      console.error('[QueueManager] ❌ Errore inizializzazione:', error);
      throw error;
    }
  }

  /**
   * Inizializza tutte le code
   */
  async initializeQueues() {
    console.log('[QueueManager] 📦 Inizializzazione code...');
    
    // Crea tutte le code con le loro configurazioni
    for (const [queueName, config] of Object.entries(QUEUE_CONFIGS)) {
      const queue = getQueue(queueName, config);
      this.jobManagers.set(queueName, new JobManager(queueName));
      console.log(`[QueueManager] ✅ Queue ${queueName} inizializzata`);
    }
    
    // Crea code aggiuntive senza configurazione specifica
    const additionalQueues = [
      QUEUE_NAMES.NOTIFICATION,
      QUEUE_NAMES.CLEANUP
    ];
    
    for (const queueName of additionalQueues) {
      const queue = getQueue(queueName);
      this.jobManagers.set(queueName, new JobManager(queueName));
      console.log(`[QueueManager] ✅ Queue ${queueName} inizializzata`);
    }
  }

  /**
   * Inizializza tutti i worker
   */
  async initializeWorkers() {
    console.log('[QueueManager] 👷 Inizializzazione worker...');
    
    // Worker per Aave Health Update
    getWorker(QUEUE_NAMES.AAVE_HEALTH_UPDATE, async (job) => {
      switch (job.name) {
        case 'update-user-health':
          return await processAaveHealthUpdate(job);
        case 'bulk-update-health':
          return await processBulkAaveHealthUpdate(job);
        default:
          throw new Error(`Job type non supportato: ${job.name}`);
      }
    }, {
      concurrency: 3 // Limita concorrenza per evitare sovraccarico RPC
    });

    // Worker per Aave Market Data
    getWorker(QUEUE_NAMES.AAVE_MARKET_DATA, async (job) => {
      switch (job.name) {
        case 'update-market-data':
          return await processAaveMarketDataUpdate(job);
        case 'bulk-update-market-data':
          return await processBulkAaveMarketDataUpdate(job);
        default:
          throw new Error(`Job type non supportato: ${job.name}`);
      }
    }, {
      concurrency: 2 // Limita concorrenza per evitare sovraccarico RPC
    });

    // Worker per User Positions Sync
    getWorker(QUEUE_NAMES.USER_POSITIONS_SYNC, async (job) => {
      switch (job.name) {
        case 'sync-user-positions':
          return await processUserPositionsSync(job);
        case 'bulk-sync-positions':
          return await processBulkUserPositionsSync(job);
        default:
          throw new Error(`Job type non supportato: ${job.name}`);
      }
    }, {
      concurrency: 5
    });

    // Worker per APY Calculation
    getWorker(QUEUE_NAMES.APY_CALCULATION, async (job) => {
      switch (job.name) {
        case 'calculate-apy-optimization':
          return await processAPYOptimization(job);
        default:
          throw new Error(`Job type non supportato: ${job.name}`);
      }
    }, {
      concurrency: 3
    });

    // Worker per Notifications
    getWorker(QUEUE_NAMES.NOTIFICATION, async (job) => {
      switch (job.name) {
        case 'send-health-alert':
          return await processHealthAlert(job);
        case 'send-apy-notification':
          return await processAPYNotification(job);
        default:
          throw new Error(`Job type non supportato: ${job.name}`);
      }
    }, {
      concurrency: 10
    });

    // Worker per Cleanup
    getWorker(QUEUE_NAMES.CLEANUP, async (job) => {
      switch (job.name) {
        case 'cleanup-cache':
          return await processCacheCleanup(job);
        case 'cleanup-old-jobs':
          return await processOldJobsCleanup(job);
        default:
          throw new Error(`Job type non supportato: ${job.name}`);
      }
    }, {
      concurrency: 1 // Cleanup sequenziale
    });

    console.log('[QueueManager] ✅ Tutti i worker inizializzati');
  }

  /**
   * Inizializza job ricorrenti
   */
  async initializeRecurringJobs() {
    console.log('[QueueManager] 🔄 Inizializzazione job ricorrenti...');
    
    const healthManager = this.jobManagers.get(QUEUE_NAMES.AAVE_HEALTH_UPDATE);
    const marketManager = this.jobManagers.get(QUEUE_NAMES.AAVE_MARKET_DATA);
    const cleanupManager = this.jobManagers.get(QUEUE_NAMES.CLEANUP);
    
    // Job ricorrente per aggiornamento dati di mercato ogni 5 minuti
    await marketManager.addRecurringJob(
      'bulk-update-market-data',
      '*/5 * * * *', // Ogni 5 minuti
      { dataType: 'all' },
      { priority: 1 }
    );
    
    // Job ricorrente per aggiornamento health utenti ogni 10 minuti
    await healthManager.addRecurringJob(
      'bulk-update-health',
      '*/10 * * * *', // Ogni 10 minuti
      {},
      { priority: 2 }
    );
    
    // Job ricorrente per pulizia cache ogni ora
    await cleanupManager.addRecurringJob(
      'cleanup-cache',
      '0 * * * *', // Ogni ora
      {},
      { priority: 3 }
    );
    
    // Job ricorrente per pulizia job vecchi ogni giorno
    await cleanupManager.addRecurringJob(
      'cleanup-old-jobs',
      '0 2 * * *', // Ogni giorno alle 2:00
      {},
      { priority: 4 }
    );
    
    console.log('[QueueManager] ✅ Job ricorrenti inizializzati');
  }

  /**
   * Ottiene il JobManager per una queue specifica
   * @param {string} queueName - Nome della queue
   * @returns {JobManager} JobManager della queue
   */
  getJobManager(queueName) {
    const manager = this.jobManagers.get(queueName);
    if (!manager) {
      throw new Error(`JobManager non trovato per queue: ${queueName}`);
    }
    return manager;
  }

  /**
   * Ottiene statistiche di tutte le code
   */
  async getAllQueueStats() {
    const stats = {};
    
    for (const [queueName, manager] of this.jobManagers) {
      try {
        stats[queueName] = await manager.getQueueStats();
      } catch (error) {
        console.error(`[QueueManager] ❌ Errore statistiche queue ${queueName}:`, error);
        stats[queueName] = { error: error.message };
      }
    }
    
    return stats;
  }

  /**
   * Chiude tutte le code e worker
   */
  async shutdown() {
    console.log('[QueueManager] 🔄 Chiusura code e worker...');
    
    // Chiudi tutti i worker
    for (const [queueName, worker] of workers) {
      await worker.close();
      console.log(`[QueueManager] ⚫ Worker ${queueName} chiuso`);
    }
    
    // Chiudi tutte le code
    for (const [queueName, queue] of queues) {
      await queue.close();
      console.log(`[QueueManager] ⚫ Queue ${queueName} chiusa`);
    }
    
    this.initialized = false;
    console.log('[QueueManager] ✅ Chiusura completata');
  }
}

// Istanza singleton del QueueManager
let queueManagerInstance = null;

/**
 * Ottiene l'istanza singleton del QueueManager
 * @returns {QueueManager} Istanza QueueManager
 */
export function getQueueManager() {
  if (!queueManagerInstance) {
    queueManagerInstance = new QueueManager();
  }
  return queueManagerInstance;
}

/**
 * Inizializza il sistema di code (da chiamare all'avvio dell'app)
 */
export async function initializeQueueSystem() {
  const queueManager = getQueueManager();
  await queueManager.initialize();
  return queueManager;
}

/**
 * Chiude il sistema di code (da chiamare alla chiusura dell'app)
 */
export async function shutdownQueueSystem() {
  const queueManager = getQueueManager();
  await queueManager.shutdown();
}

// Job processors aggiuntivi (implementazioni mock)

/**
 * Processa sincronizzazione posizioni utente
 */
async function processUserPositionsSync(job) {
  const { userAddress, chainId } = job.data;
  console.log(`[UserPositionsSync] 🔄 Sincronizzazione posizioni per ${userAddress} su chain ${chainId}`);
  
  // TODO: Implementare sincronizzazione posizioni
  return { success: true, userAddress, chainId };
}

/**
 * Processa sincronizzazione bulk posizioni utenti
 */
async function processBulkUserPositionsSync(job) {
  console.log(`[BulkUserPositionsSync] 🔄 Sincronizzazione bulk posizioni utenti`);
  
  // TODO: Implementare sincronizzazione bulk
  return { success: true, processed: 0 };
}

/**
 * Processa invio alert health
 */
async function processHealthAlert(job) {
  const { userAddress, alertType, data } = job.data;
  console.log(`[HealthAlert] 🚨 Invio alert ${alertType} per ${userAddress}`);
  
  // TODO: Implementare invio notifiche
  return { success: true, userAddress, alertType };
}

/**
 * Processa invio notifica APY
 */
async function processAPYNotification(job) {
  const { userAddress, optimization } = job.data;
  console.log(`[APYNotification] 📧 Invio notifica APY per ${userAddress}`);
  
  // TODO: Implementare invio notifiche
  return { success: true, userAddress };
}

/**
 * Processa pulizia job vecchi
 */
async function processOldJobsCleanup(job) {
  console.log(`[OldJobsCleanup] 🧹 Pulizia job vecchi`);
  
  // TODO: Implementare pulizia job vecchi
  return { success: true, cleaned: 0 };
}
