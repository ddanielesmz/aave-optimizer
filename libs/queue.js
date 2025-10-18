import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedis } from './redis.js';
import { CacheKeyBuilder, getCacheManager } from './redis.js';

// Configurazione connessione Redis per BullMQ
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
};

// Istanze delle code (singleton)
const queues = new Map();
const workers = new Map();
const queueEvents = new Map();

/**
 * Ottiene o crea una queue BullMQ
 * @param {string} queueName - Nome della queue
 * @param {object} options - Opzioni aggiuntive per la queue
 * @returns {Queue} Istanza della queue
 */
export function getQueue(queueName, options = {}) {
  if (!queues.has(queueName)) {
    const queue = new Queue(queueName, {
      connection,
      defaultJobOptions: {
        removeOnComplete: 100, // Mantieni solo gli ultimi 100 job completati
        removeOnFail: 50,     // Mantieni solo gli ultimi 50 job falliti
        attempts: 3,          // Riprova fino a 3 volte
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        ...options.defaultJobOptions
      },
      ...options
    });

    // Eventi per logging
    queue.on('error', (error) => {
      console.error(`[Queue:${queueName}] ❌ Errore queue:`, error);
    });

    queue.on('waiting', (jobId) => {
      console.log(`[Queue:${queueName}] ⏳ Job ${jobId} in attesa`);
    });

    queue.on('active', (job) => {
      console.log(`[Queue:${queueName}] 🚀 Job ${job.id} iniziato: ${job.name}`);
    });

    queue.on('completed', (job) => {
      console.log(`[Queue:${queueName}] ✅ Job ${job.id} completato: ${job.name}`);
    });

    queue.on('failed', (job, error) => {
      console.error(`[Queue:${queueName}] ❌ Job ${job?.id} fallito: ${job?.name}`, error);
    });

    queues.set(queueName, queue);
    console.log(`[Queue] 📦 Creata queue: ${queueName}`);
  }

  return queues.get(queueName);
}

/**
 * Ottiene o crea un worker BullMQ
 * @param {string} queueName - Nome della queue
 * @param {function} processor - Funzione di elaborazione del job
 * @param {object} options - Opzioni aggiuntive per il worker
 * @returns {Worker} Istanza del worker
 */
export function getWorker(queueName, processor, options = {}) {
  if (!workers.has(queueName)) {
    const worker = new Worker(queueName, processor, {
      connection,
      concurrency: 5, // Processa fino a 5 job contemporaneamente
      ...options
    });

    // Eventi per logging
    worker.on('error', (error) => {
      console.error(`[Worker:${queueName}] ❌ Errore worker:`, error);
    });

    worker.on('ready', () => {
      console.log(`[Worker:${queueName}] 🟢 Worker pronto`);
    });

    worker.on('closing', () => {
      console.log(`[Worker:${queueName}] 🔴 Worker in chiusura`);
    });

    worker.on('closed', () => {
      console.log(`[Worker:${queueName}] ⚫ Worker chiuso`);
    });

    workers.set(queueName, worker);
    console.log(`[Worker] 👷 Creato worker: ${queueName}`);
  }

  return workers.get(queueName);
}

/**
 * Ottiene o crea un QueueEvents per monitoraggio
 * @param {string} queueName - Nome della queue
 * @returns {QueueEvents} Istanza QueueEvents
 */
export function getQueueEvents(queueName) {
  if (!queueEvents.has(queueName)) {
    const events = new QueueEvents(queueName, { connection });
    
    events.on('error', (error) => {
      console.error(`[QueueEvents:${queueName}] ❌ Errore eventi:`, error);
    });

    queueEvents.set(queueName, events);
    console.log(`[QueueEvents] 📡 Creato monitoraggio eventi: ${queueName}`);
  }

  return queueEvents.get(queueName);
}

/**
 * Chiude tutte le code e worker
 */
export async function closeAllQueues() {
  console.log('[Queue] 🔄 Chiusura di tutte le code e worker...');
  
  // Chiudi tutti i worker
  for (const [name, worker] of workers) {
    await worker.close();
    console.log(`[Worker] ⚫ Worker ${name} chiuso`);
  }
  workers.clear();

  // Chiudi tutti gli eventi
  for (const [name, events] of queueEvents) {
    await events.close();
    console.log(`[QueueEvents] ⚫ Eventi ${name} chiusi`);
  }
  queueEvents.clear();

  // Chiudi tutte le code
  for (const [name, queue] of queues) {
    await queue.close();
    console.log(`[Queue] ⚫ Queue ${name} chiusa`);
  }
  queues.clear();

  console.log('[Queue] ✅ Tutte le code e worker chiusi');
}

/**
 * Utility per aggiungere job alle code con retry automatico
 */
export class JobManager {
  constructor(queueName) {
    this.queue = getQueue(queueName);
    this.cache = getCacheManager();
  }

  /**
   * Aggiunge un job alla queue
   * @param {string} jobName - Nome del job
   * @param {object} data - Dati del job
   * @param {object} options - Opzioni del job
   */
  async addJob(jobName, data = {}, options = {}) {
    try {
      const job = await this.queue.add(jobName, data, {
        delay: 0,
        ...options
      });
      
      console.log(`[JobManager] 📝 Job aggiunto: ${jobName} (ID: ${job.id})`);
      return job;
    } catch (error) {
      console.error(`[JobManager] ❌ Errore aggiunta job ${jobName}:`, error);
      throw error;
    }
  }

  /**
   * Aggiunge un job ricorrente
   * @param {string} jobName - Nome del job
   * @param {string} cronPattern - Pattern cron per la ricorrenza
   * @param {object} data - Dati del job
   * @param {object} options - Opzioni del job
   */
  async addRecurringJob(jobName, cronPattern, data = {}, options = {}) {
    try {
      const job = await this.queue.add(jobName, data, {
        repeat: { pattern: cronPattern },
        jobId: `recurring:${jobName}`, // ID fisso per evitare duplicati
        ...options
      });
      
      console.log(`[JobManager] 🔄 Job ricorrente aggiunto: ${jobName} (${cronPattern})`);
      return job;
    } catch (error) {
      console.error(`[JobManager] ❌ Errore aggiunta job ricorrente ${jobName}:`, error);
      throw error;
    }
  }

  /**
   * Ottiene lo stato di un job
   * @param {string} jobId - ID del job
   */
  async getJobStatus(jobId) {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        return { status: 'not_found' };
      }

      const state = await job.getState();
      return {
        id: job.id,
        name: job.name,
        status: state,
        data: job.data,
        progress: job.progress,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn
      };
    } catch (error) {
      console.error(`[JobManager] ❌ Errore recupero stato job ${jobId}:`, error);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Elimina un job dalla queue
   * @param {string} jobId - ID del job
   */
  async removeJob(jobId) {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.remove();
        console.log(`[JobManager] 🗑️ Job ${jobId} eliminato`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[JobManager] ❌ Errore eliminazione job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Ottiene statistiche della queue
   */
  async getQueueStats() {
    try {
      const waiting = await this.queue.getWaiting();
      const active = await this.queue.getActive();
      const completed = await this.queue.getCompleted();
      const failed = await this.queue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length
      };
    } catch (error) {
      console.error(`[JobManager] ❌ Errore statistiche queue:`, error);
      return null;
    }
  }
}

/**
 * Definizioni delle code principali del sistema
 */
export const QUEUE_NAMES = {
  AAVE_HEALTH_UPDATE: 'aave-health-update',
  AAVE_MARKET_DATA: 'aave-market-data',
  USER_POSITIONS_SYNC: 'user-positions-sync',
  APY_CALCULATION: 'apy-calculation',
  NOTIFICATION: 'notification',
  CLEANUP: 'cleanup'
};

/**
 * Configurazioni predefinite per le code
 */
export const QUEUE_CONFIGS = {
  [QUEUE_NAMES.AAVE_HEALTH_UPDATE]: {
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 25,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      }
    }
  },
  [QUEUE_NAMES.AAVE_MARKET_DATA]: {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 10000,
      }
    }
  },
  [QUEUE_NAMES.USER_POSITIONS_SYNC]: {
    defaultJobOptions: {
      removeOnComplete: 200,
      removeOnFail: 100,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      }
    }
  }
};

// Esporta anche la connessione per uso esterno
export { connection };
