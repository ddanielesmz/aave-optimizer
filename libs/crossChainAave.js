// Import selettivi per ridurre il bundle size
import { Contract } from 'ethers';
import { 
  getProvider, 
  getChainInfo, 
  getAaveContracts, 
  isChainSupported,
  getSupportedChains
} from './multiChainProvider.js';

// ABI per Aave V3 Pool
const AAVE_POOL_ABI = [
  "function getReservesList() external view returns (address[] memory)",
  "function getReserveData(address asset) external view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt) memory)",
  "function getReserveConfigurationData(address asset) external view returns (tuple(uint256 data) memory)",
  "function getUserAccountData(address user) external view returns (tuple(uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor) memory)"
];

// ABI per Pool Addresses Provider
const POOL_ADDRESSES_PROVIDER_ABI = [
  "function getPool() external view returns (address)",
  "function getPoolDataProvider() external view returns (address)",
  "function getPriceOracle() external view returns (address)"
];

/**
 * Funzione cross-chain per leggere dati Aave da tutte le reti configurate
 * @param {Array} chainIds - Array di chain ID da processare (opzionale)
 * @param {Object} options - Opzioni per la lettura dati
 * @returns {Promise<Object>} Dati aggregati da tutte le chain
 */
export async function getCrossChainAaveData(chainIds = null, options = {}) {
  console.log('🌐 Lettura Dati Cross-Chain Aave V3\n');
  
  const {
    useCache = true,
    timeout = 15000,
    includeReserveData = true,
    includeUserData = false,
    userAddress = null,
    maxConcurrent = 3 // Limite di connessioni simultanee
  } = options;
  
  // Determina le chain da processare
  const chainsToProcess = chainIds || getSupportedChains()
    .filter(chain => {
      try {
        return isChainSupported(chain.chainId) && getAaveContracts(chain.chainId);
      } catch (error) {
        return false; // Chain non supportata per Aave
      }
    })
    .map(chain => chain.chainId);
  
  console.log(`📊 Processando ${chainsToProcess.length} chain: ${chainsToProcess.join(', ')}\n`);
  
  const results = {
    success: [],
    errors: [],
    summary: {
      totalChains: chainsToProcess.length,
      successfulChains: 0,
      totalReserves: 0,
      totalLiquidity: '0',
      averageLiquidityRate: 0,
      averageBorrowRate: 0,
      timestamp: new Date().toISOString()
    }
  };
  
  // Processa le chain in batch per evitare sovraccarico
  for (let i = 0; i < chainsToProcess.length; i += maxConcurrent) {
    const batch = chainsToProcess.slice(i, i + maxConcurrent);
    console.log(`🔄 Processando batch ${Math.floor(i/maxConcurrent) + 1}: Chain ${batch.join(', ')}`);
    
    const batchPromises = batch.map(chainId => processChainData(chainId, options));
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      const chainId = batch[index];
      if (result.status === 'fulfilled' && result.value.success) {
        results.success.push(result.value);
        results.summary.successfulChains++;
        results.summary.totalReserves += result.value.reservesCount || 0;
      } else {
        const error = result.status === 'rejected' ? result.reason : result.value.error;
        results.errors.push({
          chainId,
          chainName: getChainInfo(chainId)?.name || `Chain-${chainId}`,
          error: error.message || error
        });
      }
    });
    
    console.log(`   ✅ Batch completato: ${batchResults.filter(r => r.status === 'fulfilled').length}/${batch.length} successi\n`);
  }
  
  // Calcola statistiche aggregate
  if (results.success.length > 0) {
    calculateAggregateStats(results);
  }
  
  // Stampa riepilogo
  printSummary(results);
  
  return results;
}

/**
 * Processa i dati per una singola chain
 */
async function processChainData(chainId, options) {
  const {
    useCache = true,
    timeout = 15000,
    includeReserveData = true,
    includeUserData = false,
    userAddress = null
  } = options;
  
  try {
    console.log(`   🔄 Processando chain ${chainId}...`);
    
    // Verifica supporto chain
    if (!isChainSupported(chainId)) {
      throw new Error(`Chain ${chainId} non supportata`);
    }
    
    // Ottieni contratti Aave
    const aaveContracts = getAaveContracts(chainId);
    if (!aaveContracts) {
      throw new Error(`Contratti Aave non disponibili per chain ${chainId}`);
    }
    
    // Crea provider
    const provider = await getProvider(chainId, { useCache, timeout });
    const chainInfo = getChainInfo(chainId);
    
    // Crea contratto Pool Addresses Provider
    const poolAddressesProvider = new Contract(
      aaveContracts.LENDING_POOL_ADDRESS_PROVIDER,
      POOL_ADDRESSES_PROVIDER_ABI,
      provider
    );
    
    // Ottieni indirizzo del pool
    const poolAddress = await poolAddressesProvider.getPool();
    
    // Crea contratto Pool
    const pool = new Contract(poolAddress, AAVE_POOL_ABI, provider);
    
    // Ottieni lista delle riserve
    const reservesList = await pool.getReservesList();
    
    const chainData = {
      chainId,
      chainName: chainInfo.name,
      chainSymbol: chainInfo.symbol,
      explorer: chainInfo.explorer,
      poolAddress,
      poolAddressesProvider: aaveContracts.LENDING_POOL_ADDRESS_PROVIDER,
      rpcUrl: provider.connection.url,
      reservesCount: reservesList.length,
      reservesList: reservesList,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Se richiesto, ottieni dati dettagliati delle riserve
    if (includeReserveData && reservesList.length > 0) {
      console.log(`     📊 Leggendo dati dettagliati per ${reservesList.length} riserve...`);
      
      const reservesData = [];
      let totalLiquidityRate = 0;
      let totalBorrowRate = 0;
      
      for (const assetAddress of reservesList) {
        try {
          const reserveData = await pool.getReserveData(assetAddress);
          
          // Converti i tassi da ray (27 decimali) a percentuale
          const liquidityRate = parseFloat(ethers.utils.formatUnits(reserveData.currentLiquidityRate, 25)); // 25 per avere percentuale
          const variableBorrowRate = parseFloat(ethers.utils.formatUnits(reserveData.currentVariableBorrowRate, 25));
          const stableBorrowRate = parseFloat(ethers.utils.formatUnits(reserveData.currentStableBorrowRate, 25));
          
          totalLiquidityRate += liquidityRate;
          totalBorrowRate += variableBorrowRate;
          
          reservesData.push({
            asset: assetAddress,
            configuration: reserveData.configuration.toString(),
            liquidityIndex: reserveData.liquidityIndex.toString(),
            variableBorrowIndex: reserveData.variableBorrowIndex.toString(),
            currentLiquidityRate: reserveData.currentLiquidityRate.toString(),
            currentVariableBorrowRate: reserveData.currentVariableBorrowRate.toString(),
            currentStableBorrowRate: reserveData.currentStableBorrowRate.toString(),
            liquidityRatePercent: liquidityRate,
            variableBorrowRatePercent: variableBorrowRate,
            stableBorrowRatePercent: stableBorrowRate,
            lastUpdateTimestamp: reserveData.lastUpdateTimestamp,
            id: reserveData.id,
            aTokenAddress: reserveData.aTokenAddress,
            stableDebtTokenAddress: reserveData.stableDebtTokenAddress,
            variableDebtTokenAddress: reserveData.variableDebtTokenAddress,
            accruedToTreasury: reserveData.accruedToTreasury.toString(),
            unbacked: reserveData.unbacked.toString(),
            isolationModeTotalDebt: reserveData.isolationModeTotalDebt.toString()
          });
        } catch (error) {
          console.log(`       ⚠️ Errore lettura riserva ${assetAddress}: ${error.message}`);
        }
      }
      
      chainData.reservesData = reservesData;
      chainData.averageLiquidityRate = totalLiquidityRate / reservesList.length;
      chainData.averageBorrowRate = totalBorrowRate / reservesList.length;
    }
    
    // Se richiesto, ottieni dati utente
    if (includeUserData && userAddress) {
      try {
        console.log(`     👤 Leggendo dati utente per ${userAddress}...`);
        const userAccountData = await pool.getUserAccountData(userAddress);
        
        chainData.userData = {
          totalCollateralBase: userAccountData.totalCollateralBase.toString(),
          totalDebtBase: userAccountData.totalDebtBase.toString(),
          availableBorrowsBase: userAccountData.availableBorrowsBase.toString(),
          currentLiquidationThreshold: userAccountData.currentLiquidationThreshold.toString(),
          ltv: userAccountData.ltv.toString(),
          healthFactor: userAccountData.healthFactor.toString()
        };
      } catch (error) {
        console.log(`       ⚠️ Errore lettura dati utente: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Chain ${chainId} completata: ${reservesList.length} riserve`);
    return chainData;
    
  } catch (error) {
    console.log(`   ❌ Errore chain ${chainId}: ${error.message}`);
    return {
      chainId,
      chainName: getChainInfo(chainId)?.name || `Chain-${chainId}`,
      success: false,
      error: error.message
    };
  }
}

/**
 * Calcola statistiche aggregate
 */
function calculateAggregateStats(results) {
  const successfulChains = results.success;
  
  // Calcola totali
  let totalLiquidityRate = 0;
  let totalBorrowRate = 0;
  let chainCount = 0;
  
  successfulChains.forEach(chain => {
    if (chain.averageLiquidityRate !== undefined) {
      totalLiquidityRate += chain.averageLiquidityRate;
      totalBorrowRate += chain.averageBorrowRate || 0;
      chainCount++;
    }
  });
  
  // Aggiorna summary
  results.summary.averageLiquidityRate = chainCount > 0 ? totalLiquidityRate / chainCount : 0;
  results.summary.averageBorrowRate = chainCount > 0 ? totalBorrowRate / chainCount : 0;
  results.summary.totalLiquidity = '0'; // Placeholder per ora
}

/**
 * Stampa riepilogo dei risultati
 */
function printSummary(results) {
  console.log('📊 RIEPILOGO CROSS-CHAIN AAVE V3\n');
  console.log('=' * 60);
  
  console.log(`✅ Chain connesse con successo: ${results.summary.successfulChains}/${results.summary.totalChains}`);
  console.log(`📊 Totale riserve: ${results.summary.totalReserves}`);
  console.log(`📈 Tasso medio liquidità: ${results.summary.averageLiquidityRate.toFixed(4)}%`);
  console.log(`📈 Tasso medio prestito: ${results.summary.averageBorrowRate.toFixed(4)}%`);
  console.log('');
  
  if (results.success.length > 0) {
    console.log('🎉 CHAIN CON DATI AAVE:');
    results.success.forEach(chain => {
      console.log(`   ✅ ${chain.chainName} (${chain.chainId}):`);
      console.log(`      📊 Riserve: ${chain.reservesCount}`);
      console.log(`      📋 Pool: ${chain.poolAddress}`);
      if (chain.averageLiquidityRate !== undefined) {
        console.log(`      💧 Tasso liquidità: ${chain.averageLiquidityRate.toFixed(4)}%`);
        console.log(`      💰 Tasso prestito: ${(chain.averageBorrowRate || 0).toFixed(4)}%`);
      }
      console.log('');
    });
  }
  
  if (results.errors.length > 0) {
    console.log('⚠️ CHAIN CON ERRORI:');
    results.errors.forEach(error => {
      console.log(`   ❌ ${error.chainName} (${error.chainId}): ${error.error}`);
    });
    console.log('');
  }
}

/**
 * Funzione semplificata per ottenere dati da chain specifiche
 */
export async function getAaveDataForChains(chainIds, options = {}) {
  return await getCrossChainAaveData(chainIds, options);
}

/**
 * Funzione per ottenere dati da tutte le chain supportate
 */
export async function getAllAaveData(options = {}) {
  return await getCrossChainAaveData(null, options);
}

/**
 * Funzione per ottenere solo le statistiche aggregate
 */
export async function getAaveStats(chainIds = null, options = {}) {
  const results = await getCrossChainAaveData(chainIds, {
    ...options,
    includeReserveData: false,
    includeUserData: false
  });
  
  return {
    totalChains: results.summary.totalChains,
    successfulChains: results.summary.successfulChains,
    totalReserves: results.summary.totalReserves,
    successRate: (results.summary.successfulChains / results.summary.totalChains * 100).toFixed(1) + '%',
    chains: results.success.map(chain => ({
      chainId: chain.chainId,
      chainName: chain.chainName,
      reservesCount: chain.reservesCount,
      poolAddress: chain.poolAddress
    }))
  };
}

// Esporta anche le funzioni di utilità
export { AAVE_POOL_ABI, POOL_ADDRESSES_PROVIDER_ABI };
