// Import selettivi per ridurre il bundle size
import { JsonRpcProvider, Contract } from 'ethers';
import { 
  getProvider, 
  getChainInfo, 
  getAaveContracts, 
  isChainSupported,
  getSupportedChains
} from './multiChainProvider.js';

// ABI semplificato per Aave V3 Pool
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
 * Legge i pool Aave V3 su tutte le chain supportate
 */
export async function readAavePoolsOnAllChains(options = {}) {
  console.log('🏦 Lettura Pool Aave V3 su tutte le chain\n');
  
  const {
    useCache = true,
    timeout = 15000,
    includeReserveData = false
  } = options;
  
  const results = {};
  const supportedChains = getSupportedChains();
  
  console.log(`📊 Testando ${supportedChains.length} chain per Aave V3...\n`);
  
  for (const chain of supportedChains) {
    const chainId = chain.chainId;
    
    try {
      console.log(`🔄 Processando ${chain.name} (${chainId})...`);
      
      // Verifica se la chain supporta Aave
      if (!isChainSupported(chainId)) {
        console.log(`   ⚠️ ${chain.name} non supportata dal provider manager`);
        continue;
      }
      
      const aaveContracts = getAaveContracts(chainId);
      if (!aaveContracts) {
        console.log(`   ⚠️ ${chain.name} non ha contratti Aave configurati`);
        continue;
      }
      
      // Crea provider per la chain
      const provider = await getProvider(chainId, { useCache, timeout });
      
      // Leggi pool Aave
      const poolData = await readAavePool(chainId, provider, aaveContracts, includeReserveData);
      
      results[chainId] = {
        chainId,
        chainName: chain.name,
        success: true,
        ...poolData
      };
      
      console.log(`   ✅ ${chain.name}: ${poolData.reservesCount} riserve trovate`);
      
    } catch (error) {
      console.log(`   ❌ ${chain.name}: ${error.message}`);
      
      results[chainId] = {
        chainId,
        chainName: chain.name,
        success: false,
        error: error.message
      };
    }
    
    console.log('');
  }
  
  // Riepilogo risultati
  const successfulChains = Object.values(results).filter(r => r.success);
  const failedChains = Object.values(results).filter(r => !r.success);
  
  console.log('📊 RIEPILOGO RISULTATI AAVE V3\n');
  console.log('=' * 50);
  console.log(`✅ Chain con pool Aave: ${successfulChains.length}`);
  console.log(`❌ Chain con errori: ${failedChains.length}`);
  console.log('');
  
  if (successfulChains.length > 0) {
    console.log('🎉 POOL AAVE TROVATI:');
    successfulChains.forEach(result => {
      console.log(`   ✅ ${result.chainName}: ${result.reservesCount} riserve`);
      console.log(`      📋 Pool: ${result.poolAddress}`);
      console.log(`      🔗 RPC: ${result.rpcUrl}`);
      console.log('');
    });
  }
  
  if (failedChains.length > 0) {
    console.log('⚠️ CHAIN CON ERRORI:');
    failedChains.forEach(result => {
      console.log(`   ❌ ${result.chainName}: ${result.error}`);
      console.log('');
    });
  }
  
  return results;
}

/**
 * Legge i pool Aave per una chain specifica
 */
export async function readAavePool(chainId, provider, aaveContracts, includeReserveData = false) {
  try {
    // Crea contratto Pool Addresses Provider
    const poolAddressesProvider = new Contract(
      aaveContracts.LENDING_POOL_ADDRESS_PROVIDER,
      POOL_ADDRESSES_PROVIDER_ABI,
      provider
    );
    
    // Ottieni indirizzo del pool
    const poolAddress = await poolAddressesProvider.getPool();
    
    // Crea contratto Pool
    const pool = new Contract(
      poolAddress,
      AAVE_POOL_ABI,
      provider
    );
    
    // Ottieni lista delle riserve
    const reservesList = await pool.getReservesList();
    
    const result = {
      poolAddress,
      poolAddressesProvider: aaveContracts.LENDING_POOL_ADDRESS_PROVIDER,
      reservesCount: reservesList.length,
      reservesList: reservesList,
      rpcUrl: provider.connection.url,
      timestamp: new Date().toISOString()
    };
    
    // Se richiesto, ottieni dati dettagliati delle riserve
    if (includeReserveData && reservesList.length > 0) {
      console.log(`   📊 Leggendo dati dettagliati per ${reservesList.length} riserve...`);
      
      const reservesData = [];
      for (const assetAddress of reservesList.slice(0, 5)) { // Limita a 5 per evitare timeout
        try {
          const reserveData = await pool.getReserveData(assetAddress);
          const configData = await pool.getReserveConfigurationData(assetAddress);
          
          reservesData.push({
            asset: assetAddress,
            configuration: reserveData.configuration.toString(),
            liquidityIndex: reserveData.liquidityIndex.toString(),
            variableBorrowIndex: reserveData.variableBorrowIndex.toString(),
            currentLiquidityRate: reserveData.currentLiquidityRate.toString(),
            currentVariableBorrowRate: reserveData.currentVariableBorrowRate.toString(),
            currentStableBorrowRate: reserveData.currentStableBorrowRate.toString(),
            lastUpdateTimestamp: reserveData.lastUpdateTimestamp,
            id: reserveData.id,
            aTokenAddress: reserveData.aTokenAddress,
            stableDebtTokenAddress: reserveData.stableDebtTokenAddress,
            variableDebtTokenAddress: reserveData.variableDebtTokenAddress,
            accruedToTreasury: reserveData.accruedToTreasury.toString(),
            unbacked: reserveData.unbacked.toString(),
            isolationModeTotalDebt: reserveData.isolationModeTotalDebt.toString(),
            configurationData: configData.data.toString()
          });
        } catch (error) {
          console.log(`     ⚠️ Errore lettura riserva ${assetAddress}: ${error.message}`);
        }
      }
      
      result.reservesData = reservesData;
    }
    
    return result;
    
  } catch (error) {
    throw new Error(`Errore lettura pool Aave: ${error.message}`);
  }
}

/**
 * Legge i pool Aave per una chain specifica usando il provider manager
 */
export async function readAavePoolByChainId(chainId, options = {}) {
  const {
    useCache = true,
    timeout = 15000,
    includeReserveData = false
  } = options;
  
  try {
    // Verifica se la chain è supportata
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
    
    // Leggi pool
    const poolData = await readAavePool(chainId, provider, aaveContracts, includeReserveData);
    
    return {
      chainId,
      chainName: getChainInfo(chainId).name,
      success: true,
      ...poolData
    };
    
  } catch (error) {
    return {
      chainId,
      chainName: getChainInfo(chainId)?.name || `Chain-${chainId}`,
      success: false,
      error: error.message
    };
  }
}

/**
 * Testa la connessione ai pool Aave su tutte le chain
 */
export async function testAaveConnections() {
  console.log('🧪 Test Connessioni Aave V3\n');
  
  const results = await readAavePoolsOnAllChains({
    useCache: true,
    timeout: 10000,
    includeReserveData: false
  });
  
  const successfulChains = Object.values(results).filter(r => r.success);
  const totalReserves = successfulChains.reduce((sum, r) => sum + (r.reservesCount || 0), 0);
  
  console.log('📈 STATISTICHE FINALI:');
  console.log(`   🔗 Chain connesse: ${successfulChains.length}`);
  console.log(`   📊 Totale riserve: ${totalReserves}`);
  console.log(`   ⚡ Performance: ${successfulChains.length > 0 ? 'Ottima' : 'Da migliorare'}`);
  
  return results;
}

// Esporta anche le funzioni di utilità
export { AAVE_POOL_ABI, POOL_ADDRESSES_PROVIDER_ABI };
