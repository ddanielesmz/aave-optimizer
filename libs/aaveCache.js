/**
 * Sistema di caching per i dati Aave
 * Riduce le chiamate duplicate e migliora le performance
 */

class AaveDataCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.fetchPromises = new Map(); // Per evitare fetch duplicati
    this.CACHE_DURATION = 120000; // 2 minuti invece di 30 secondi
    this.PREFETCH_DURATION = 60000; // 1 minuto per prefetch
    this.MAX_CACHE_SIZE = 200; // Aumentato per più dati
    // Persistenza lato browser
    this.isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    this.STORAGE_PREFIX = 'aaveCache:';
  }

  /**
   * Genera una chiave di cache basata su parametri
   */
  generateKey(prefix, ...params) {
    return `${prefix}:${params.join(':')}`;
  }

  /**
   * Verifica se i dati sono ancora validi
   */
  isValid(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return false;
    
    const now = Date.now();
    return (now - timestamp) < this.CACHE_DURATION;
  }

  /**
   * Verifica se i dati sono validi per prefetch (più breve)
   */
  isValidForPrefetch(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return false;
    
    const now = Date.now();
    return (now - timestamp) < this.PREFETCH_DURATION;
  }

  /**
   * Ottiene dati dalla cache se validi
   */
  get(key) {
    if (this.isValid(key)) {
      console.log(`[AaveCache] ✅ Cache hit (memory) for key: ${key}`);
      return this.cache.get(key);
    }

    // Tentativo di lettura da localStorage se in memoria non valido
    const persisted = this.loadFromStorage(key);
    if (persisted !== null) {
      console.log(`[AaveCache] ✅ Cache hit (storage) for key: ${key}`);
      this.cache.set(key, persisted.data);
      this.timestamps.set(key, persisted.ts);
      return persisted.data;
    }

    console.log(`[AaveCache] ❌ Cache miss for key: ${key}`);
    return null;
  }

  /**
   * Salva dati nella cache
   */
  set(key, data) {
    // Pulisci cache se troppo grande
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanup();
    }

    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
    console.log(`[AaveCache] 💾 Cached data for key: ${key}`);
    // Persisti anche su localStorage lato browser
    this.saveToStorage(key, data);
  }

  /**
   * Pulisce cache vecchia
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, timestamp] of this.timestamps.entries()) {
      if ((now - timestamp) >= this.CACHE_DURATION) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.timestamps.delete(key);
    });

    console.log(`[AaveCache] 🧹 Cleaned up ${keysToDelete.length} expired entries`);
  }

  /**
   * Invalida cache per una chiave specifica
   */
  invalidate(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    console.log(`[AaveCache] 🗑️ Invalidated cache for key: ${key}`);
    this.removeFromStorage(key);
  }

  /**
   * Invalida tutta la cache
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
    console.log(`[AaveCache] 🧹 Cleared all cache`);
    if (this.isBrowser) {
      // Rimuovi tutte le chiavi con prefisso dal localStorage
      try {
        const toRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith(this.STORAGE_PREFIX)) toRemove.push(k);
        }
        toRemove.forEach(k => window.localStorage.removeItem(k));
      } catch (e) {
        // Ignora errori di storage (quota, privacy mode)
      }
    }
  }

  /**
   * Ottiene statistiche della cache
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const timestamp of this.timestamps.values()) {
      if ((now - timestamp) < this.CACHE_DURATION) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheDuration: this.CACHE_DURATION
    };
  }
}

// Istanza singleton
const aaveCache = new AaveDataCache();

/**
 * Wrapper per funzioni di fetch con caching e deduplicazione
 */
export async function withCache(key, fetchFunction, ...args) {
  // Estrai il parametro forceRefresh se presente
  const forceRefresh = args[args.length - 1] === true;
  const actualArgs = forceRefresh ? args.slice(0, -1) : args;
  
  // Se non è un refresh forzato, prova a ottenere dalla cache
  if (!forceRefresh) {
    const cachedData = aaveCache.get(key);
    if (cachedData !== null) {
      return cachedData;
    }
  }

  // Controlla se c'è già un fetch in corso per questa chiave
  if (aaveCache.fetchPromises.has(key)) {
    console.log(`[AaveCache] ⏳ Waiting for ongoing fetch for key: ${key}`);
    return await aaveCache.fetchPromises.get(key);
  }

  // Crea una nuova promise di fetch
  const fetchPromise = (async () => {
    try {
      console.log(`[AaveCache] 🔄 Fetching fresh data for key: ${key}${forceRefresh ? ' (forced refresh)' : ''}`);
      const data = await fetchFunction(...actualArgs);
      
      // Salva in cache solo se i dati sono validi
      if (data !== null && data !== undefined) {
        aaveCache.set(key, data);
      }
      
      return data;
    } catch (error) {
      console.error(`[AaveCache] ❌ Error fetching data for key ${key}:`, error);
      throw error;
    } finally {
      // Rimuovi la promise dalla mappa quando completata
      aaveCache.fetchPromises.delete(key);
    }
  })();

  // Salva la promise nella mappa
  aaveCache.fetchPromises.set(key, fetchPromise);
  
  return await fetchPromise;
}

/**
 * Prefetch dati per reti vicine (per switch più fluido)
 */
export async function prefetchNetworkData(address, currentChainId) {
  const { getAaveConfig, isAaveSupported } = await import('./aaveConfig.js');
  
  // Lista delle reti supportate
  const supportedChains = [1, 137, 10, 42161, 43114];
  
  // Prefetch per le altre reti (esclusa quella corrente)
  const prefetchPromises = supportedChains
    .filter(chainId => chainId !== currentChainId && isAaveSupported(chainId))
    .map(async (chainId) => {
      try {
        const key = cacheKeys.userAccountData(address, chainId);
        
        // Solo se non è già in cache o è scaduta
        if (!aaveCache.isValidForPrefetch(key)) {
          console.log(`[AaveCache] 🚀 Prefetching data for chain ${chainId}`);
          
          // Prefetch in background senza bloccare
          const { fetchAaveUserAccountData } = await import('./aaveOnchain.js');
          withCache(key, fetchAaveUserAccountData, address, chainId).catch(error => {
            console.log(`[AaveCache] ⚠️ Prefetch failed for chain ${chainId}:`, error.message);
          });
        }
      } catch (error) {
        console.log(`[AaveCache] ⚠️ Prefetch error for chain ${chainId}:`, error.message);
      }
    });
  
  // Non aspettare il completamento, esegui in background
  Promise.allSettled(prefetchPromises);
}

/**
 * Funzioni di cache specifiche per i dati Aave
 */
export const cacheKeys = {
  userAccountData: (address, chainId) => `userAccount:${address}:${chainId}`,
  supplyPositions: (address, chainId) => `supplyPositions:${address}:${chainId}`,
  borrowPositions: (address, chainId) => `borrowPositions:${address}:${chainId}`,
  stablecoinAPYs: (chainId) => `stablecoinAPYs:${chainId}`,
  stablecoinBorrowRates: (chainId) => `stablecoinBorrowRates:${chainId}`,
  availableStablecoins: (chainId) => `availableStablecoins:${chainId}`
};

/**
 * Invalida cache per un utente specifico
 */
export function invalidateUserCache(address, chainId) {
  const keys = [
    cacheKeys.userAccountData(address, chainId),
    cacheKeys.supplyPositions(address, chainId),
    cacheKeys.borrowPositions(address, chainId)
  ];
  
  keys.forEach(key => aaveCache.invalidate(key));
  console.log(`[AaveCache] 🗑️ Invalidated user cache for ${address} on chain ${chainId}`);
}

/**
 * Invalida cache per una chain specifica
 */
export function invalidateChainCache(chainId) {
  const keys = [
    cacheKeys.stablecoinAPYs(chainId),
    cacheKeys.stablecoinBorrowRates(chainId),
    cacheKeys.availableStablecoins(chainId)
  ];
  
  keys.forEach(key => aaveCache.invalidate(key));
  console.log(`[AaveCache] 🗑️ Invalidated chain cache for chain ${chainId}`);
}

export default aaveCache;

/**
 * Helpers di persistenza su localStorage
 */
AaveDataCache.prototype.saveToStorage = function (key, data) {
  if (!this.isBrowser) return;
  try {
    const payload = JSON.stringify({ ts: Date.now(), data }, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
    window.localStorage.setItem(this.STORAGE_PREFIX + key, payload);
  } catch (_) {
    // Silenzia errori (quota, JSON)
  }
};

AaveDataCache.prototype.loadFromStorage = function (key) {
  if (!this.isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(this.STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const { ts, data } = parsed || {};
    if (!ts) return null;
    const now = Date.now();
    if (now - ts < this.CACHE_DURATION) {
      return { ts, data };
    }
    // Scaduto: rimuovi
    window.localStorage.removeItem(this.STORAGE_PREFIX + key);
    return null;
  } catch (_) {
    return null;
  }
};

AaveDataCache.prototype.removeFromStorage = function (key) {
  if (!this.isBrowser) return;
  try {
    window.localStorage.removeItem(this.STORAGE_PREFIX + key);
  } catch (_) {
    // ignore
  }
};
