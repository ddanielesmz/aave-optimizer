// Import selettivi per ridurre il bundle size
import { JsonRpcProvider } from "ethers";

// Configurazione per browser vs Node.js
const isBrowser = typeof window !== 'undefined';

// Funzione per ottenere le variabili d'ambiente in modo sicuro
function getEnvVar(key, defaultValue) {
  if (isBrowser) {
    // Nel browser, usa variabili d'ambiente pubbliche o default
    return defaultValue;
  }
  return process.env[key] || defaultValue;
}

// Carica le variabili d'ambiente solo in Node.js
if (!isBrowser) {
  try {
    // Usa require invece di import dinamico per evitare topLevelAwait
    require('dotenv').config();
  } catch (error) {
    console.warn('dotenv non disponibile in questo ambiente');
  }
}

/**
 * Configurazione centralizzata per tutti i provider blockchain
 * Gestisce automaticamente le variabili d'ambiente e fornisce fallback
 */
const RPC_CONFIG = {
  // Ethereum Mainnet
  1: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    explorer: "https://etherscan.io",
    rpcUrl: getEnvVar('RPC_URL_ETHEREUM', "https://eth-mainnet.g.alchemy.com/v2/idE6XaTpL_7iDgKwvhQJl"),
    rpcUrls: [
      getEnvVar('RPC_URL_ETHEREUM', null),
      "https://eth-mainnet.g.alchemy.com/v2/idE6XaTpL_7iDgKwvhQJl", // ✅ Funziona
      "https://ethereum.publicnode.com", // ✅ Funziona
      "https://rpc.ankr.com/eth", // ✅ Funziona
      "https://eth.llamarpc.com", // ✅ Funziona
      "https://cloudflare-eth.com" // ⚠️ Parziale
    ].filter(Boolean),
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  
  // Polygon
  137: {
    name: "Polygon",
    symbol: "MATIC", 
    decimals: 18,
    explorer: "https://polygonscan.com",
    rpcUrl: getEnvVar('RPC_URL_POLYGON', "https://polygon-rpc.com"),
    rpcUrls: [
      getEnvVar('RPC_URL_POLYGON', null),
      "https://polygon-rpc.com",
      "https://polygon-mainnet.g.alchemy.com/v2/demo",
      "https://rpc.ankr.com/polygon"
    ].filter(Boolean),
    nativeCurrency: { name: "Polygon", symbol: "MATIC", decimals: 18 }
  },
  
  // Optimism
  10: {
    name: "Optimism",
    symbol: "ETH",
    decimals: 18,
    explorer: "https://optimistic.etherscan.io",
    rpcUrl: getEnvVar('RPC_URL_OPTIMISM', "https://mainnet.optimism.io"),
    rpcUrls: [
      getEnvVar('RPC_URL_OPTIMISM', null),
      "https://mainnet.optimism.io",
      "https://opt-mainnet.g.alchemy.com/v2/demo",
      "https://rpc.ankr.com/optimism"
    ].filter(Boolean),
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  
  // Arbitrum
  42161: {
    name: "Arbitrum",
    symbol: "ETH",
    decimals: 18,
    explorer: "https://arbiscan.io",
    rpcUrl: getEnvVar('RPC_URL_ARBITRUM', "https://arb1.arbitrum.io/rpc"),
    rpcUrls: [
      getEnvVar('RPC_URL_ARBITRUM', null),
      "https://arb1.arbitrum.io/rpc",
      "https://arbitrum-mainnet.infura.io/v3/demo",
      "https://arbitrum-mainnet.g.alchemy.com/v2/demo",
      "https://rpc.ankr.com/arbitrum",
      "https://arbitrum.publicnode.com"
    ].filter(Boolean),
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  
  // Avalanche
  43114: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
    explorer: "https://snowtrace.io",
    rpcUrl: getEnvVar('RPC_URL_AVALANCHE', "https://api.avax.network/ext/bc/C/rpc"),
    rpcUrls: [
      getEnvVar('RPC_URL_AVALANCHE', null),
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avalanche-mainnet.infura.io/v3/demo",
      "https://rpc.ankr.com/avalanche"
    ].filter(Boolean),
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 }
  },
  
  // Base
  8453: {
    name: "Base",
    symbol: "ETH",
    decimals: 18,
    explorer: "https://basescan.org",
    rpcUrl: getEnvVar('RPC_URL_BASE', "https://mainnet.base.org"),
    rpcUrls: [
      getEnvVar('RPC_URL_BASE', null),
      "https://mainnet.base.org",
      "https://base-mainnet.g.alchemy.com/v2/demo",
      "https://rpc.ankr.com/base"
    ].filter(Boolean),
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  
  // BSC
  56: {
    name: "BSC",
    symbol: "BNB",
    decimals: 18,
    explorer: "https://bscscan.com",
    rpcUrl: getEnvVar('RPC_URL_BSC', "https://bsc-dataseed.binance.org"),
    rpcUrls: [
      getEnvVar('RPC_URL_BSC', null),
      "https://bsc-dataseed.binance.org",
      "https://bsc-dataseed1.defibit.io",
      "https://rpc.ankr.com/bsc"
    ].filter(Boolean),
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 }
  },
  
  // Fantom
  250: {
    name: "Fantom",
    symbol: "FTM",
    decimals: 18,
    explorer: "https://ftmscan.com",
    rpcUrl: getEnvVar('RPC_URL_FANTOM', "https://rpc.ftm.tools"),
    rpcUrls: [
      getEnvVar('RPC_URL_FANTOM', null),
      "https://rpc.ftm.tools",
      "https://rpc.ankr.com/fantom"
    ].filter(Boolean),
    nativeCurrency: { name: "Fantom", symbol: "FTM", decimals: 18 }
  },
  
  // Gnosis
  100: {
    name: "Gnosis",
    symbol: "XDAI",
    decimals: 18,
    explorer: "https://gnosisscan.io",
    rpcUrl: getEnvVar('RPC_URL_GNOSIS', "https://rpc.gnosischain.com"),
    rpcUrls: [
      getEnvVar('RPC_URL_GNOSIS', null),
      "https://rpc.gnosischain.com",
      "https://rpc.ankr.com/gnosis"
    ].filter(Boolean),
    nativeCurrency: { name: "xDAI", symbol: "XDAI", decimals: 18 }
  }
};

/**
 * Configurazione dei contratti Aave per ogni rete
 */
const AAVE_CONTRACTS = {
  1: { // Ethereum Mainnet - Aave V3
    LENDING_POOL_ADDRESS_PROVIDER: '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e',
    PROTOCOL_DATA_PROVIDER: '0x7B4EB56E7CD4b454BA8ff71E4518426369a43a9e',
    POOL_DATA_PROVIDER: '0x7B4EB56E7CD4b454BA8ff71E4518426369a43a9e',
    INCENTIVE_DATA_PROVIDER: '0x1627c67d276Ce545E4f96922335C47b39e2b2B2c'
  },
  137: { // Polygon - Aave V3
    LENDING_POOL_ADDRESS_PROVIDER: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
    PROTOCOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    POOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    INCENTIVE_DATA_PROVIDER: '0x929EC64c34a17401F460460D4B6950514A4D042'
  },
  10: { // Optimism - Aave V3
    LENDING_POOL_ADDRESS_PROVIDER: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
    PROTOCOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    POOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    INCENTIVE_DATA_PROVIDER: '0x929EC64c34a17401F460460D4B6950514A4D042'
  },
  42161: { // Arbitrum - Aave V3
    LENDING_POOL_ADDRESS_PROVIDER: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
    PROTOCOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    POOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    INCENTIVE_DATA_PROVIDER: '0x929EC64c34a17401F460460D4B6950514A4D042'
  },
  43114: { // Avalanche - Aave V3
    LENDING_POOL_ADDRESS_PROVIDER: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
    PROTOCOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    POOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    INCENTIVE_DATA_PROVIDER: '0x929EC64c34a17401F460460D4B6950514A4D042'
  },
  8453: { // Base - Aave V3
    LENDING_POOL_ADDRESS_PROVIDER: '0x8d2de8d2f744F8170Eef0047a0E24f46C942d4a3',
    PROTOCOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    POOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    INCENTIVE_DATA_PROVIDER: '0x929EC64c34a17401F460460D4B6950514A4D042'
  },
  56: { // BSC - Aave V3
    LENDING_POOL_ADDRESS_PROVIDER: '0xff75A4B698E3Ec95E608ac0f22A03B8368E05F5D',
    PROTOCOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    POOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    INCENTIVE_DATA_PROVIDER: '0x929EC64c34a17401F460460D4B6950514A4D042'
  },
  100: { // Gnosis - Aave V3
    LENDING_POOL_ADDRESS_PROVIDER: '0x36616cf17557639614c1cdDb356b1B83fc0B2132',
    PROTOCOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    POOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    INCENTIVE_DATA_PROVIDER: '0x929EC64c34a17401F460460D4B6950514A4D042'
  }
};

/**
 * Cache per i provider per evitare di ricrearli continuamente
 */
const providerCache = new Map();

/**
 * Ottiene un provider per una specifica chain con retry automatico su RPC alternativi
 * @param {number} chainId - ID della chain
 * @param {object} options - Opzioni aggiuntive
 * @param {boolean} options.useCache - Se usare la cache (default: true)
 * @param {number} options.timeout - Timeout in ms (default: 15000)
 * @param {number} options.retryCount - Numero di tentativi (default: 3)
 * @returns {Promise<JsonRpcProvider>} Provider configurato
 */
export async function getProvider(chainId, options = {}) {
  const {
    useCache = true,
    timeout = 15000,
    retryCount = 3
  } = options;

  // Controlla se la chain è supportata
  if (!RPC_CONFIG[chainId]) {
    throw new Error(`Chain ${chainId} non supportata. Chain supportate: ${Object.keys(RPC_CONFIG).join(', ')}`);
  }

  // Controlla la cache se abilitata
  if (useCache && providerCache.has(chainId)) {
    return providerCache.get(chainId);
  }

  const chainConfig = RPC_CONFIG[chainId];
  const rpcUrls = chainConfig.rpcUrls || [chainConfig.rpcUrl];
  
  let lastError = null;
  
  // Prova ogni RPC URL in sequenza
  for (let i = 0; i < rpcUrls.length; i++) {
    const rpcUrl = rpcUrls[i];
    
    if (!rpcUrl) continue;
    
    try {
      console.log(`[ProviderManager] 🔄 Tentativo ${i + 1}/${rpcUrls.length} per chain ${chainId}: ${rpcUrl}`);
      
      const provider = new JsonRpcProvider(rpcUrl, {
        name: chainConfig.name,
        chainId: chainId,
        timeout: timeout
      });
      
      // Testa la connessione
      const network = await provider.getNetwork();
      if (network.chainId !== chainId) {
        throw new Error(`Chain ID mismatch: expected ${chainId}, got ${network.chainId}`);
      }
      
      console.log(`[ProviderManager] ✅ Connesso con successo a ${chainConfig.name} (${chainId})`);
      
      // Salva in cache se abilitata
      if (useCache) {
        providerCache.set(chainId, provider);
      }
      
      return provider;
      
    } catch (error) {
      console.error(`[ProviderManager] ❌ Errore con RPC ${rpcUrl}:`, error.message);
      lastError = error;
      
      // Se non è l'ultimo RPC, continua con il prossimo
      if (i < rpcUrls.length - 1) {
        console.log(`[ProviderManager] 🔄 Provo con il prossimo RPC...`);
        continue;
      }
    }
  }
  
  // Se tutti gli RPC falliscono, lancia l'ultimo errore
  throw new Error(`Tutti gli RPC endpoints sono falliti per chain ${chainId}. Ultimo errore: ${lastError?.message}`);
}

/**
 * Ottiene informazioni su una chain
 * @param {number} chainId - ID della chain
 * @returns {object} Informazioni della chain
 */
export function getChainInfo(chainId) {
  if (!RPC_CONFIG[chainId]) {
    throw new Error(`Chain ${chainId} non supportata`);
  }
  return RPC_CONFIG[chainId];
}

/**
 * Ottiene gli indirizzi dei contratti Aave per una chain
 * @param {number} chainId - ID della chain
 * @returns {object} Indirizzi dei contratti
 */
export function getAaveContracts(chainId) {
  if (!AAVE_CONTRACTS[chainId]) {
    throw new Error(`Contratti Aave non disponibili per chainId: ${chainId}`);
  }
  return AAVE_CONTRACTS[chainId];
}

/**
 * Verifica se una chain è supportata
 * @param {number} chainId - ID della chain
 * @returns {boolean} True se supportata
 */
export function isChainSupported(chainId) {
  return chainId in RPC_CONFIG;
}

/**
 * Ottiene la lista delle chain supportate
 * @returns {Array} Array di oggetti con chainId e informazioni
 */
export function getSupportedChains() {
  return Object.keys(RPC_CONFIG).map(chainId => ({
    chainId: parseInt(chainId),
    ...RPC_CONFIG[chainId]
  }));
}

/**
 * Ottiene tutti i provider configurati
 * @param {object} options - Opzioni per i provider
 * @returns {Promise<object>} Oggetto con chainId come chiave e provider come valore
 */
export async function getAllProviders(options = {}) {
  const providers = {};
  const chainIds = Object.keys(RPC_CONFIG);
  
  console.log(`[ProviderManager] 🚀 Inizializzazione provider per ${chainIds.length} chain...`);
  
  for (const chainId of chainIds) {
    try {
      providers[parseInt(chainId)] = await getProvider(parseInt(chainId), options);
    } catch (error) {
      console.warn(`[ProviderManager] ⚠️ Impossibile creare provider per chain ${chainId}:`, error.message);
    }
  }
  
  const successCount = Object.keys(providers).length;
  console.log(`[ProviderManager] ✅ Inizializzati ${successCount}/${chainIds.length} provider`);
  
  return providers;
}

/**
 * Testa la connessione a una chain
 * @param {number} chainId - ID della chain
 * @returns {Promise<boolean>} True se connesso
 */
export async function testConnection(chainId) {
  try {
    const provider = await getProvider(chainId, { useCache: false });
    const network = await provider.getNetwork();
    return network.chainId === chainId;
  } catch (error) {
    console.error(`[ProviderManager] ❌ Errore connessione chain ${chainId}:`, error.message);
    return false;
  }
}

/**
 * Testa tutte le connessioni
 * @returns {Promise<object>} Risultati dei test
 */
export async function testAllConnections() {
  const results = {};
  const chainIds = Object.keys(RPC_CONFIG);
  
  console.log(`[ProviderManager] 🧪 Test connessioni per ${chainIds.length} chain...`);
  
  for (const chainId of chainIds) {
    const chainIdNum = parseInt(chainId);
    results[chainIdNum] = await testConnection(chainIdNum);
  }
  
  const successCount = Object.values(results).filter(Boolean).length;
  console.log(`[ProviderManager] ✅ Test completati: ${successCount}/${chainIds.length} connessioni riuscite`);
  
  return results;
}

/**
 * Pulisce la cache dei provider
 */
export function clearProviderCache() {
  providerCache.clear();
  console.log('[ProviderManager] 🧹 Cache provider pulita');
}

/**
 * Ottiene statistiche sulla cache
 * @returns {object} Statistiche della cache
 */
export function getCacheStats() {
  return {
    size: providerCache.size,
    chains: Array.from(providerCache.keys())
  };
}

// Esporta anche le configurazioni per compatibilità
export { RPC_CONFIG, AAVE_CONTRACTS };
