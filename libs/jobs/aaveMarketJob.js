import { 
  fetchStablecoinAPYsOnchain, 
  fetchStablecoinBorrowRatesOnchain,
  detectAvailableStablecoinsOnchain 
} from '../aaveOnchain.js';
import { CacheKeyBuilder, getCacheManager } from '../redis.js';
import { getQueue, QUEUE_NAMES, QUEUE_CONFIGS } from '../queue.js';

const cache = getCacheManager();

// Chain supportate per Aave
const SUPPORTED_CHAINS = [1, 137, 10, 42161, 43114];

/**
 * Job per aggiornare i dati di mercato Aave (APY, tassi, etc.)
 * @param {object} job - Job BullMQ
 * @param {object} job.data - Dati del job
 * @param {number} job.data.chainId - Chain ID
 * @param {string} job.data.dataType - Tipo di dati (apys, rates, reserves)
 * @param {boolean} job.data.forceUpdate - Forza aggiornamento anche se cache valida
 */
export async function processAaveMarketDataUpdate(job) {
  const { chainId, dataType = 'all', forceUpdate = false } = job.data;
  
  console.log(`[AaveMarketJob] 📊 Inizio aggiornamento dati mercato per chain ${chainId}, tipo: ${dataType}`);
  
  try {
    const results = {};
    
    // Aggiorna APY degli stablecoin
    if (dataType === 'all' || dataType === 'apys') {
      await job.updateProgress(20);
      results.apys = await updateStablecoinAPYs(chainId, forceUpdate);
    }
    
    // Aggiorna tassi di borrow
    if (dataType === 'all' || dataType === 'rates') {
      await job.updateProgress(50);
      results.rates = await updateStablecoinBorrowRates(chainId, forceUpdate);
    }
    
    // Aggiorna lista riserve disponibili
    if (dataType === 'all' || dataType === 'reserves') {
      await job.updateProgress(80);
      results.reserves = await updateAvailableReserves(chainId, forceUpdate);
    }
    
    await job.updateProgress(100);
    
    console.log(`[AaveMarketJob] ✅ Dati mercato aggiornati per chain ${chainId}:`, {
      apys: results.apys?.length || 0,
      rates: results.rates?.length || 0,
      reserves: results.reserves?.length || 0
    });
    
    return {
      success: true,
      chainId,
      dataType,
      results,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error(`[AaveMarketJob] ❌ Errore aggiornamento dati mercato per chain ${chainId}:`, error);
    throw error;
  }
}

/**
 * Aggiorna APY degli stablecoin
 * @param {number} chainId - Chain ID
 * @param {boolean} forceUpdate - Forza aggiornamento
 */
async function updateStablecoinAPYs(chainId, forceUpdate = false) {
  const cacheKey = CacheKeyBuilder.marketAaveData(chainId, 'apys');
  
  // Controlla cache se non forzato
  if (!forceUpdate) {
    const cachedAPYs = await cache.get(cacheKey);
    if (cachedAPYs) {
      console.log(`[AaveMarketJob] ✅ APY già in cache per chain ${chainId}`);
      return cachedAPYs;
    }
  }
  
  console.log(`[AaveMarketJob] 🔍 Fetching APY on-chain per chain ${chainId}...`);
  
  try {
    const apys = await fetchStablecoinAPYsOnchain(chainId);
    
    // Salva in cache con TTL di 10 minuti
    await cache.set(cacheKey, apys, 600);
    
    console.log(`[AaveMarketJob] 💾 APY salvati in cache per chain ${chainId}: ${apys.length} stablecoin`);
    
    return apys;
  } catch (error) {
    console.error(`[AaveMarketJob] ❌ Errore fetch APY per chain ${chainId}:`, error);
    
    // Prova a restituire dati cached se disponibili
    const cachedAPYs = await cache.get(cacheKey);
    if (cachedAPYs) {
      console.log(`[AaveMarketJob] ⚠️ Restituisco APY cached in caso di errore`);
      return cachedAPYs;
    }
    
    throw error;
  }
}

/**
 * Aggiorna tassi di borrow degli stablecoin
 * @param {number} chainId - Chain ID
 * @param {boolean} forceUpdate - Forza aggiornamento
 */
async function updateStablecoinBorrowRates(chainId, forceUpdate = false) {
  const cacheKey = CacheKeyBuilder.marketAaveData(chainId, 'rates');
  
  // Controlla cache se non forzato
  if (!forceUpdate) {
    const cachedRates = await cache.get(cacheKey);
    if (cachedRates) {
      console.log(`[AaveMarketJob] ✅ Tassi già in cache per chain ${chainId}`);
      return cachedRates;
    }
  }
  
  console.log(`[AaveMarketJob] 🔍 Fetching tassi borrow on-chain per chain ${chainId}...`);
  
  try {
    const rates = await fetchStablecoinBorrowRatesOnchain(chainId);
    
    // Salva in cache con TTL di 10 minuti
    await cache.set(cacheKey, rates, 600);
    
    console.log(`[AaveMarketJob] 💾 Tassi salvati in cache per chain ${chainId}: ${rates.length} stablecoin`);
    
    return rates;
  } catch (error) {
    console.error(`[AaveMarketJob] ❌ Errore fetch tassi per chain ${chainId}:`, error);
    
    // Prova a restituire dati cached se disponibili
    const cachedRates = await cache.get(cacheKey);
    if (cachedRates) {
      console.log(`[AaveMarketJob] ⚠️ Restituisco tassi cached in caso di errore`);
      return cachedRates;
    }
    
    throw error;
  }
}

/**
 * Aggiorna lista riserve disponibili
 * @param {number} chainId - Chain ID
 * @param {boolean} forceUpdate - Forza aggiornamento
 */
async function updateAvailableReserves(chainId, forceUpdate = false) {
  const cacheKey = CacheKeyBuilder.marketAaveData(chainId, 'reserves');
  
  // Controlla cache se non forzato
  if (!forceUpdate) {
    const cachedReserves = await cache.get(cacheKey);
    if (cachedReserves) {
      console.log(`[AaveMarketJob] ✅ Riserve già in cache per chain ${chainId}`);
      return cachedReserves;
    }
  }
  
  console.log(`[AaveMarketJob] 🔍 Fetching riserve disponibili on-chain per chain ${chainId}...`);
  
  try {
    const reserves = await detectAvailableStablecoinsOnchain(chainId);
    
    // Salva in cache con TTL di 30 minuti (le riserve cambiano raramente)
    await cache.set(cacheKey, reserves, 1800);
    
    console.log(`[AaveMarketJob] 💾 Riserve salvate in cache per chain ${chainId}: ${reserves.length} stablecoin`);
    
    return reserves;
  } catch (error) {
    console.error(`[AaveMarketJob] ❌ Errore fetch riserve per chain ${chainId}:`, error);
    
    // Prova a restituire dati cached se disponibili
    const cachedReserves = await cache.get(cacheKey);
    if (cachedReserves) {
      console.log(`[AaveMarketJob] ⚠️ Restituisco riserve cached in caso di errore`);
      return cachedReserves;
    }
    
    throw error;
  }
}

/**
 * Job per aggiornamento bulk dei dati di mercato per tutte le chain
 * @param {object} job - Job BullMQ
 * @param {object} job.data - Dati del job
 * @param {string} job.data.dataType - Tipo di dati (apys, rates, reserves, all)
 */
export async function processBulkAaveMarketDataUpdate(job) {
  const { dataType = 'all' } = job.data;
  
  console.log(`[BulkAaveMarketJob] 📊 Inizio aggiornamento bulk dati mercato per tutte le chain, tipo: ${dataType}`);
  
  try {
    const marketQueue = getQueue(QUEUE_NAMES.AAVE_MARKET_DATA, QUEUE_CONFIGS[QUEUE_NAMES.AAVE_MARKET_DATA]);
    const results = [];
    
    // Aggiungi job per ogni chain supportata
    for (let i = 0; i < SUPPORTED_CHAINS.length; i++) {
      const chainId = SUPPORTED_CHAINS[i];
      
      try {
        const marketJob = await marketQueue.add('update-market-data', {
          chainId,
          dataType,
          forceUpdate: true
        }, {
          delay: i * 2000, // Spread i job nel tempo
          priority: 1
        });
        
        results.push({
          chainId,
          dataType,
          jobId: marketJob.id,
          status: 'queued'
        });
        
        // Aggiorna progress
        await job.updateProgress((i + 1) / SUPPORTED_CHAINS.length * 100);
        
      } catch (error) {
        console.error(`[BulkAaveMarketJob] ❌ Errore aggiunta job per chain ${chainId}:`, error);
        results.push({
          chainId,
          dataType,
          status: 'error',
          error: error.message
        });
      }
    }
    
    console.log(`[BulkAaveMarketJob] ✅ Aggiunti ${results.length} job alla queue`);
    
    return {
      success: true,
      processed: results.length,
      results,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error(`[BulkAaveMarketJob] ❌ Errore aggiornamento bulk dati mercato:`, error);
    throw error;
  }
}

/**
 * Job per calcolo APY ottimizzati per utenti
 * @param {object} job - Job BullMQ
 * @param {object} job.data - Dati del job
 * @param {string} job.data.userAddress - Indirizzo utente
 * @param {number} job.data.chainId - Chain ID
 */
export async function processAPYOptimization(job) {
  const { userAddress, chainId } = job.data;
  
  console.log(`[APYOptimizationJob] 🎯 Calcolo ottimizzazioni APY per ${userAddress} su chain ${chainId}`);
  
  try {
    // Recupera posizioni utente dalla cache
    const positionsCacheKey = CacheKeyBuilder.userAaveData(userAddress, chainId, 'positions');
    const userPositions = await cache.get(positionsCacheKey);
    
    if (!userPositions) {
      throw new Error(`Posizioni utente non trovate in cache per ${userAddress}`);
    }
    
    // Recupera dati di mercato dalla cache
    const marketAPYsKey = CacheKeyBuilder.marketAaveData(chainId, 'apys');
    const marketAPYs = await cache.get(marketAPYsKey);
    
    if (!marketAPYs) {
      throw new Error(`Dati di mercato non trovati in cache per chain ${chainId}`);
    }
    
    await job.updateProgress(30);
    
    // Calcola ottimizzazioni
    const optimizations = calculateAPYOptimizations(userPositions, marketAPYs);
    
    await job.updateProgress(80);
    
    // Salva ottimizzazioni in cache
    const optimizationCacheKey = CacheKeyBuilder.userAaveData(userAddress, chainId, 'optimizations');
    await cache.set(optimizationCacheKey, optimizations, 600); // 10 minuti TTL
    
    await job.updateProgress(100);
    
    console.log(`[APYOptimizationJob] ✅ Ottimizzazioni calcolate per ${userAddress}:`, {
      totalOptimizations: optimizations.length,
      potentialGains: optimizations.reduce((sum, opt) => sum + opt.potentialGain, 0)
    });
    
    return {
      success: true,
      userAddress,
      chainId,
      optimizations,
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error(`[APYOptimizationJob] ❌ Errore calcolo ottimizzazioni per ${userAddress}:`, error);
    throw error;
  }
}

/**
 * Calcola ottimizzazioni APY per le posizioni utente
 * @param {object} userPositions - Posizioni utente
 * @param {Array} marketAPYs - APY di mercato
 * @returns {Array} Lista ottimizzazioni
 */
function calculateAPYOptimizations(userPositions, marketAPYs) {
  const optimizations = [];
  
  // Analizza posizioni di supply
  if (userPositions.supplyPositions) {
    for (const position of userPositions.supplyPositions) {
      const currentAPY = position.currentSupplyRate || 0;
      
      // Trova alternative con APY migliore
      const alternatives = marketAPYs.filter(apy => 
        apy.symbol !== position.token && 
        apy.apy > currentAPY + 0.001 // Minimo miglioramento 0.1%
      );
      
      if (alternatives.length > 0) {
        const bestAlternative = alternatives.reduce((best, current) => 
          current.apy > best.apy ? current : best
        );
        
        const potentialGain = (bestAlternative.apy - currentAPY) * position.totalSupply;
        
        optimizations.push({
          type: 'supply_optimization',
          currentToken: position.token,
          currentAPY,
          suggestedToken: bestAlternative.symbol,
          suggestedAPY: bestAlternative.apy,
          currentAmount: position.totalSupply,
          potentialGain,
          improvement: bestAlternative.apy - currentAPY,
          riskLevel: 'low' // Supply è generalmente a basso rischio
        });
      }
    }
  }
  
  // Analizza posizioni di borrow
  if (userPositions.borrowPositions) {
    for (const position of userPositions.borrowPositions) {
      const currentRate = position.currentVariableBorrowRate || position.currentBorrowRate || 0;
      
      // Trova alternative con tasso migliore
      const alternatives = marketAPYs.filter(apy => 
        apy.symbol !== position.token && 
        apy.borrowRate < currentRate - 0.001 // Minimo miglioramento 0.1%
      );
      
      if (alternatives.length > 0) {
        const bestAlternative = alternatives.reduce((best, current) => 
          current.borrowRate < best.borrowRate ? current : best
        );
        
        const potentialSavings = (currentRate - bestAlternative.borrowRate) * position.totalDebt;
        
        optimizations.push({
          type: 'borrow_optimization',
          currentToken: position.token,
          currentRate,
          suggestedToken: bestAlternative.symbol,
          suggestedRate: bestAlternative.borrowRate,
          currentAmount: position.totalDebt,
          potentialSavings,
          improvement: currentRate - bestAlternative.borrowRate,
          riskLevel: 'medium' // Borrow ha rischio medio
        });
      }
    }
  }
  
  // Ordina per potenziale guadagno/risparmio
  return optimizations.sort((a, b) => {
    const aGain = a.potentialGain || a.potentialSavings || 0;
    const bGain = b.potentialGain || b.potentialSavings || 0;
    return bGain - aGain;
  });
}
