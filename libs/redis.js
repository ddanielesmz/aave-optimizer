import Redis from 'ioredis';

// Configurazione Redis con supporto multi-environment
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  // Configurazione per produzione
  ...(process.env.NODE_ENV === 'production' && {
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    family: 4, // IPv4
  })
};

// Istanza Redis singleton
let redisInstance = null;

/**
 * Ottiene l'istanza Redis connessa
 * @returns {Redis} Istanza Redis
 */
export function getRedis() {
  // Se siamo in produzione, restituisci un mock per evitare errori
  if (process.env.NODE_ENV === 'production' || process.env.QUEUE_ENABLED === 'false') {
    console.log('[Redis] ⚠️ Redis disabilitato in produzione');
    return null;
  }

  if (!redisInstance) {
    redisInstance = new Redis(redisConfig);
    
    redisInstance.on('connect', () => {
      console.log('[Redis] ✅ Connesso a Redis');
    });
    
    redisInstance.on('error', (error) => {
      console.error('[Redis] ❌ Errore Redis:', error);
    });
    
    redisInstance.on('close', () => {
      console.log('[Redis] 🔌 Connessione Redis chiusa');
    });
    
    redisInstance.on('reconnecting', () => {
      console.log('[Redis] 🔄 Riconnessione a Redis...');
    });
  }
  
  return redisInstance;
}

/**
 * Chiude la connessione Redis
 */
export async function closeRedis() {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
    console.log('[Redis] 🔌 Connessione Redis chiusa');
  }
}

/**
 * Utility per operazioni di cache con TTL automatico
 */
export class CacheManager {
  constructor(redis = null) {
    this.redis = redis || getRedis();
  }

  /**
   * Salva dati in cache con TTL
   * @param {string} key - Chiave cache
   * @param {any} data - Dati da salvare
   * @param {number} ttlSeconds - TTL in secondi (default: 300 = 5 minuti)
   */
  async set(key, data, ttlSeconds = 300) {
    try {
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl: ttlSeconds
      });
      
      await this.redis.setex(key, ttlSeconds, serializedData);
      console.log(`[Cache] 💾 Salvato in cache: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      console.error(`[Cache] ❌ Errore salvataggio cache ${key}:`, error);
    }
  }

  /**
   * Recupera dati dalla cache
   * @param {string} key - Chiave cache
   * @returns {any|null} Dati dalla cache o null se non trovati
   */
  async get(key) {
    try {
      const cached = await this.redis.get(key);
      if (!cached) {
        console.log(`[Cache] ❌ Cache miss: ${key}`);
        return null;
      }

      const parsed = JSON.parse(cached);
      console.log(`[Cache] ✅ Cache hit: ${key}`);
      return parsed.data;
    } catch (error) {
      console.error(`[Cache] ❌ Errore lettura cache ${key}:`, error);
      return null;
    }
  }

  /**
   * Elimina una chiave dalla cache
   * @param {string} key - Chiave da eliminare
   */
  async delete(key) {
    try {
      await this.redis.del(key);
      console.log(`[Cache] 🗑️ Eliminato dalla cache: ${key}`);
    } catch (error) {
      console.error(`[Cache] ❌ Errore eliminazione cache ${key}:`, error);
    }
  }

  /**
   * Elimina tutte le chiavi che corrispondono a un pattern
   * @param {string} pattern - Pattern delle chiavi da eliminare
   */
  async deletePattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`[Cache] 🗑️ Eliminate ${keys.length} chiavi con pattern: ${pattern}`);
      }
    } catch (error) {
      console.error(`[Cache] ❌ Errore eliminazione pattern ${pattern}:`, error);
    }
  }

  /**
   * Controlla se una chiave esiste nella cache
   * @param {string} key - Chiave da controllare
   * @returns {boolean} True se la chiave esiste
   */
  async exists(key) {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error(`[Cache] ❌ Errore controllo esistenza ${key}:`, error);
      return false;
    }
  }

  /**
   * Ottiene il TTL rimanente di una chiave
   * @param {string} key - Chiave da controllare
   * @returns {number} TTL in secondi (-1 se non ha TTL, -2 se non esiste)
   */
  async getTTL(key) {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error(`[Cache] ❌ Errore controllo TTL ${key}:`, error);
      return -2;
    }
  }

  /**
   * Incrementa un contatore atomico
   * @param {string} key - Chiave del contatore
   * @param {number} increment - Valore di incremento (default: 1)
   * @param {number} ttlSeconds - TTL per il contatore (opzionale)
   */
  async increment(key, increment = 1, ttlSeconds = null) {
    try {
      const result = await this.redis.incrby(key, increment);
      if (ttlSeconds && await this.redis.ttl(key) === -1) {
        await this.redis.expire(key, ttlSeconds);
      }
      return result;
    } catch (error) {
      console.error(`[Cache] ❌ Errore incremento ${key}:`, error);
      return 0;
    }
  }
}

// Istanza singleton del CacheManager
let cacheManagerInstance = null;

/**
 * Ottiene l'istanza singleton del CacheManager
 * @returns {CacheManager} Istanza CacheManager
 */
export function getCacheManager() {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
}

/**
 * Utility per generare chiavi cache consistenti
 */
export class CacheKeyBuilder {
  /**
   * Genera chiave per dati utente Aave
   * @param {string} userAddress - Indirizzo utente
   * @param {number} chainId - Chain ID
   * @param {string} dataType - Tipo di dati (account, positions, health, etc.)
   */
  static userAaveData(userAddress, chainId, dataType) {
    return `aave:user:${userAddress.toLowerCase()}:${chainId}:${dataType}`;
  }

  /**
   * Genera chiave per dati di mercato Aave
   * @param {number} chainId - Chain ID
   * @param {string} dataType - Tipo di dati (apys, rates, reserves, etc.)
   */
  static marketAaveData(chainId, dataType) {
    return `aave:market:${chainId}:${dataType}`;
  }

  /**
   * Genera chiave per job BullMQ
   * @param {string} jobType - Tipo di job
   * @param {string} identifier - Identificatore specifico
   */
  static jobData(jobType, identifier) {
    return `job:${jobType}:${identifier}`;
  }

  /**
   * Genera chiave per rate limiting
   * @param {string} identifier - Identificatore (IP, user, etc.)
   * @param {string} action - Azione limitata
   */
  static rateLimit(identifier, action) {
    return `ratelimit:${identifier}:${action}`;
  }

  /**
   * Genera chiave per sessioni utente
   * @param {string} userId - ID utente
   */
  static userSession(userId) {
    return `session:user:${userId}`;
  }
}

// Esporta anche la configurazione per uso esterno
export { redisConfig };
