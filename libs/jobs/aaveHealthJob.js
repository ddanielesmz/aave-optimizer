import { fetchAaveUserAccountData } from '../aaveOnchain.js';
import { CacheKeyBuilder, getCacheManager } from '../redis.js';
import { getQueue, QUEUE_NAMES, QUEUE_CONFIGS } from '../queue.js';

const cache = getCacheManager();

/**
 * Job per aggiornare la health di tutte le posizioni Aave di un utente
 * @param {object} job - Job BullMQ
 * @param {object} job.data - Dati del job
 * @param {string} job.data.userAddress - Indirizzo utente
 * @param {number} job.data.chainId - Chain ID
 * @param {boolean} job.data.forceUpdate - Forza aggiornamento anche se cache valida
 */
export async function processAaveHealthUpdate(job) {
  const { userAddress, chainId, forceUpdate = false } = job.data;
  
  console.log(`[AaveHealthJob] 🏥 Inizio aggiornamento health per ${userAddress} su chain ${chainId}`);
  
  try {
    // Genera chiave cache
    const cacheKey = CacheKeyBuilder.userAaveData(userAddress, chainId, 'health');
    
    // Controlla se abbiamo dati recenti in cache (se non forzato)
    if (!forceUpdate) {
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        console.log(`[AaveHealthJob] ✅ Dati health già in cache per ${userAddress}`);
        return {
          success: true,
          fromCache: true,
          data: cachedData,
          timestamp: Date.now()
        };
      }
    }

    // Aggiorna progress del job
    await job.updateProgress(10);

    // Fetch dati on-chain
    console.log(`[AaveHealthJob] 🔍 Fetching dati on-chain per ${userAddress}...`);
    const healthData = await fetchAaveUserAccountData(userAddress, chainId);
    
    await job.updateProgress(50);

    if (!healthData) {
      throw new Error(`Nessun dato health trovato per ${userAddress} su chain ${chainId}`);
    }

    // Calcola metriche aggiuntive
    const enhancedHealthData = {
      ...healthData,
      // Calcola health score (0-100)
      healthScore: calculateHealthScore(healthData),
      // Calcola rischio di liquidazione
      liquidationRisk: calculateLiquidationRisk(healthData),
      // Calcola efficienza del capitale
      capitalEfficiency: calculateCapitalEfficiency(healthData),
      // Timestamp dell'ultimo aggiornamento
      lastUpdated: Date.now(),
      // Chain ID per riferimento
      chainId
    };

    await job.updateProgress(80);

    // Salva in cache con TTL di 5 minuti
    await cache.set(cacheKey, enhancedHealthData, 300);
    
    await job.updateProgress(100);

    console.log(`[AaveHealthJob] ✅ Health aggiornata per ${userAddress}:`, {
      healthFactor: enhancedHealthData.healthFactor,
      healthScore: enhancedHealthData.healthScore,
      liquidationRisk: enhancedHealthData.liquidationRisk,
      totalCollateral: enhancedHealthData.totalCollateral,
      totalDebt: enhancedHealthData.totalDebt
    });

    return {
      success: true,
      fromCache: false,
      data: enhancedHealthData,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error(`[AaveHealthJob] ❌ Errore aggiornamento health per ${userAddress}:`, error);
    
    // In caso di errore, prova a restituire dati cached se disponibili
    const cacheKey = CacheKeyBuilder.userAaveData(userAddress, chainId, 'health');
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`[AaveHealthJob] ⚠️ Restituisco dati cached in caso di errore`);
      return {
        success: true,
        fromCache: true,
        data: cachedData,
        error: error.message,
        timestamp: Date.now()
      };
    }
    
    throw error;
  }
}

/**
 * Calcola health score (0-100) basato su health factor e altri parametri
 * @param {object} healthData - Dati health da Aave
 * @returns {number} Health score da 0 a 100
 */
function calculateHealthScore(healthData) {
  const { healthFactor, totalCollateral, totalDebt, ltv, currentLiquidationThreshold } = healthData;
  
  // Health factor è il parametro principale (1.0 = sicuro, <1.0 = rischio liquidazione)
  let score = 0;
  
  if (healthFactor >= 2.0) {
    score = 100; // Molto sicuro
  } else if (healthFactor >= 1.5) {
    score = 85; // Sicuro
  } else if (healthFactor >= 1.2) {
    score = 70; // Moderato
  } else if (healthFactor >= 1.0) {
    score = 50; // Attenzione
  } else if (healthFactor >= 0.8) {
    score = 25; // Alto rischio
  } else {
    score = 0; // Critico
  }
  
  // Bonus per diversificazione (se ha multiple posizioni)
  const hasMultiplePositions = (healthData.supplyPositions?.length > 1) || 
                              (healthData.borrowPositions?.length > 1);
  if (hasMultiplePositions) {
    score = Math.min(100, score + 5);
  }
  
  // Penalità per LTV alto
  const ltvPercent = ltv / 100; // Converti da base points
  if (ltvPercent > 0.8) {
    score = Math.max(0, score - 10);
  }
  
  return Math.round(score);
}

/**
 * Calcola rischio di liquidazione
 * @param {object} healthData - Dati health da Aave
 * @returns {string} Livello di rischio
 */
function calculateLiquidationRisk(healthData) {
  const { healthFactor } = healthData;
  
  if (healthFactor >= 2.0) {
    return 'very_low';
  } else if (healthFactor >= 1.5) {
    return 'low';
  } else if (healthFactor >= 1.2) {
    return 'moderate';
  } else if (healthFactor >= 1.0) {
    return 'high';
  } else {
    return 'critical';
  }
}

/**
 * Calcola efficienza del capitale
 * @param {object} healthData - Dati health da Aave
 * @returns {number} Efficienza in percentuale
 */
function calculateCapitalEfficiency(healthData) {
  const { totalCollateral, totalDebt, availableBorrows } = healthData;
  
  if (totalCollateral === 0) {
    return 0;
  }
  
  // Calcola quanto del capitale è utilizzato produttivamente
  const utilizedCapital = totalDebt + (totalCollateral - availableBorrows);
  const efficiency = (utilizedCapital / totalCollateral) * 100;
  
  return Math.round(Math.min(100, Math.max(0, efficiency)));
}

/**
 * Job per aggiornare la health di tutti gli utenti attivi
 * @param {object} job - Job BullMQ
 * @param {object} job.data - Dati del job
 * @param {number} job.data.chainId - Chain ID (opzionale, aggiorna tutte le chain se non specificato)
 */
export async function processBulkAaveHealthUpdate(job) {
  const { chainId = null } = job.data;
  
  console.log(`[BulkAaveHealthJob] 🏥 Inizio aggiornamento bulk health${chainId ? ` per chain ${chainId}` : ' per tutte le chain'}`);
  
  try {
    // Lista degli utenti attivi (da implementare con database)
    const activeUsers = await getActiveUsers(chainId);
    
    if (activeUsers.length === 0) {
      console.log(`[BulkAaveHealthJob] ⚠️ Nessun utente attivo trovato`);
      return { success: true, processed: 0 };
    }
    
    console.log(`[BulkAaveHealthJob] 📊 Trovati ${activeUsers.length} utenti attivi`);
    
    const healthQueue = getQueue(QUEUE_NAMES.AAVE_HEALTH_UPDATE, QUEUE_CONFIGS[QUEUE_NAMES.AAVE_HEALTH_UPDATE]);
    const results = [];
    
    // Aggiungi job individuali per ogni utente
    for (let i = 0; i < activeUsers.length; i++) {
      const user = activeUsers[i];
      
      try {
        const healthJob = await healthQueue.add('update-user-health', {
          userAddress: user.address,
          chainId: user.chainId,
          forceUpdate: true
        }, {
          delay: i * 1000, // Spread i job nel tempo per evitare sovraccarico
          priority: user.priority || 0
        });
        
        results.push({
          userAddress: user.address,
          chainId: user.chainId,
          jobId: healthJob.id,
          status: 'queued'
        });
        
        // Aggiorna progress
        await job.updateProgress((i + 1) / activeUsers.length * 100);
        
      } catch (error) {
        console.error(`[BulkAaveHealthJob] ❌ Errore aggiunta job per ${user.address}:`, error);
        results.push({
          userAddress: user.address,
          chainId: user.chainId,
          status: 'error',
          error: error.message
        });
      }
    }
    
    console.log(`[BulkAaveHealthJob] ✅ Aggiunti ${results.length} job alla queue`);
    
    return {
      success: true,
      processed: results.length,
      results,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error(`[BulkAaveHealthJob] ❌ Errore aggiornamento bulk:`, error);
    throw error;
  }
}

/**
 * Ottiene la lista degli utenti attivi (mock implementation)
 * @param {number} chainId - Chain ID (opzionale)
 * @returns {Array} Lista utenti attivi
 */
async function getActiveUsers(chainId = null) {
  // TODO: Implementare con database reale
  // Per ora restituisce una lista mock
  const mockUsers = [
    { address: '0x1234567890123456789012345678901234567890', chainId: 42161, priority: 1 },
    { address: '0x2345678901234567890123456789012345678901', chainId: 1, priority: 2 },
    { address: '0x3456789012345678901234567890123456789012', chainId: 137, priority: 1 },
  ];
  
  if (chainId) {
    return mockUsers.filter(user => user.chainId === chainId);
  }
  
  return mockUsers;
}

/**
 * Job per pulizia cache scaduta
 * @param {object} job - Job BullMQ
 */
export async function processCacheCleanup(job) {
  console.log(`[CacheCleanupJob] 🧹 Inizio pulizia cache`);
  
  try {
    // Elimina cache scadute per pattern specifici
    const patterns = [
      'aave:user:*:health',
      'aave:market:*:apys',
      'aave:market:*:rates',
      'job:*:status'
    ];
    
    let totalCleaned = 0;
    
    for (const pattern of patterns) {
      const cleaned = await cache.deletePattern(pattern);
      totalCleaned += cleaned || 0;
    }
    
    console.log(`[CacheCleanupJob] ✅ Pulizia completata: ${totalCleaned} chiavi eliminate`);
    
    return {
      success: true,
      cleanedKeys: totalCleaned,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error(`[CacheCleanupJob] ❌ Errore pulizia cache:`, error);
    throw error;
  }
}
