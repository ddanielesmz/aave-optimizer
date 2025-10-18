// Import selettivi per ridurre il bundle size
import { JsonRpcProvider } from "ethers";
import { 
  getProvider as getProviderManager, 
  getChainInfo as getChainInfoManager,
  getAaveContracts as getAaveContractsManager,
  isChainSupported as isChainSupportedManager,
  getSupportedChains as getSupportedChainsManager,
  getAllProviders as getAllProvidersManager,
  testConnection as testConnectionManager,
  testAllConnections as testAllConnectionsManager,
  RPC_CONFIG,
  AAVE_CONTRACTS
} from "./providerManager.js";

// Configurazione per browser vs Node.js
const isBrowser = typeof window !== 'undefined';

// Funzione per ottenere le variabili d'ambiente in modo sicuro
function getEnvVar(key, defaultValue) {
  if (isBrowser) {
    return defaultValue;
  }
  return process.env[key] || defaultValue;
}

// Carica le variabili d'ambiente solo in Node.js
if (!isBrowser) {
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
  } catch (error) {
    console.warn('dotenv non disponibile in questo ambiente');
  }
}

// Configurazione RPC per tutte le chain supportate (per compatibilità)
const rpcUrls = {
  // Ethereum
  1: getEnvVar('RPC_URL_ETHEREUM', "https://cloudflare-eth.com"),
  
  // Polygon
  137: getEnvVar('RPC_URL_POLYGON', "https://polygon-rpc.com"),
  
  // Optimism
  10: getEnvVar('RPC_URL_OPTIMISM', "https://mainnet.optimism.io"),
  
  // Arbitrum
  42161: getEnvVar('RPC_URL_ARBITRUM', "https://arb1.arbitrum.io/rpc"),
  
  // Avalanche
  43114: getEnvVar('RPC_URL_AVALANCHE', "https://api.avax.network/ext/bc/C/rpc"),
  
  // Base
  8453: getEnvVar('RPC_URL_BASE', "https://mainnet.base.org"),
  
  // BSC
  56: getEnvVar('RPC_URL_BSC', "https://bsc-dataseed.binance.org"),
  
  // Fantom
  250: getEnvVar('RPC_URL_FANTOM', "https://rpc.ftm.tools"),
  
  // Gnosis
  100: getEnvVar('RPC_URL_GNOSIS', "https://rpc.gnosischain.com"),
  
  // Celo
  42220: getEnvVar('RPC_URL_CELO', "https://forno.celo.org"),
  
  // Moonbeam
  1284: getEnvVar('RPC_URL_MOONBEAM', "https://rpc.api.moonbeam.network"),
  
  // Harmony
  1666600000: getEnvVar('RPC_URL_HARMONY', "https://api.harmony.one"),
};

// Informazioni delle chain supportate
const chainInfo = {
  1: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    explorer: "https://etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  137: {
    name: "Polygon",
    symbol: "MATIC",
    decimals: 18,
    explorer: "https://polygonscan.com",
    nativeCurrency: { name: "Polygon", symbol: "MATIC", decimals: 18 }
  },
  10: {
    name: "Optimism",
    symbol: "ETH",
    decimals: 18,
    explorer: "https://optimistic.etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  42161: {
    name: "Arbitrum",
    symbol: "ETH",
    decimals: 18,
    explorer: "https://arbiscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  43114: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
    explorer: "https://snowtrace.io",
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 }
  },
  8453: {
    name: "Base",
    symbol: "ETH",
    decimals: 18,
    explorer: "https://basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
  },
  56: {
    name: "BSC",
    symbol: "BNB",
    decimals: 18,
    explorer: "https://bscscan.com",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 }
  },
  250: {
    name: "Fantom",
    symbol: "FTM",
    decimals: 18,
    explorer: "https://ftmscan.com",
    nativeCurrency: { name: "Fantom", symbol: "FTM", decimals: 18 }
  },
  100: {
    name: "Gnosis",
    symbol: "XDAI",
    decimals: 18,
    explorer: "https://gnosisscan.io",
    nativeCurrency: { name: "xDAI", symbol: "XDAI", decimals: 18 }
  },
  42220: {
    name: "Celo",
    symbol: "CELO",
    decimals: 18,
    explorer: "https://celoscan.io",
    nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 }
  },
  1284: {
    name: "Moonbeam",
    symbol: "GLMR",
    decimals: 18,
    explorer: "https://moonbeam.moonscan.io",
    nativeCurrency: { name: "Moonbeam", symbol: "GLMR", decimals: 18 }
  },
  1666600000: {
    name: "Harmony",
    symbol: "ONE",
    decimals: 18,
    explorer: "https://explorer.harmony.one",
    nativeCurrency: { name: "Harmony", symbol: "ONE", decimals: 18 }
  }
};

// Indirizzi dei contratti Aave per diverse chain
const aaveContracts = {
  1: { // Ethereum Mainnet
    LENDING_POOL_ADDRESS_PROVIDER: '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e',
    PROTOCOL_DATA_PROVIDER: '0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d',
    POOL_DATA_PROVIDER: '0x7B4EB56E7CD4b454BA8ff71E4518426369a43a9e',
    INCENTIVE_DATA_PROVIDER: '0x1627c67d276Ce545E4f96922335C47b39e2b2B2c'
  },
  137: { // Polygon
    LENDING_POOL_ADDRESS_PROVIDER: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    PROTOCOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    POOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    INCENTIVE_DATA_PROVIDER: '0x929EC64c34a17401F460460D4B6950514A4D042'
  },
  10: { // Optimism
    LENDING_POOL_ADDRESS_PROVIDER: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    PROTOCOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    POOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    INCENTIVE_DATA_PROVIDER: '0x929EC64c34a17401F460460D4B6950514A4D042'
  },
  42161: { // Arbitrum
    LENDING_POOL_ADDRESS_PROVIDER: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    PROTOCOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    POOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    INCENTIVE_DATA_PROVIDER: '0x929EC64c34a17401F460460D4B6950514A4D042'
  },
  43114: { // Avalanche
    LENDING_POOL_ADDRESS_PROVIDER: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    PROTOCOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    POOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    INCENTIVE_DATA_PROVIDER: '0x929EC64c34a17401F460460D4B6950514A4D042'
  },
  8453: { // Base
    LENDING_POOL_ADDRESS_PROVIDER: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    PROTOCOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    POOL_DATA_PROVIDER: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    INCENTIVE_DATA_PROVIDER: '0x929EC64c34a17401F460460D4B6950514A4D042'
  }
};

/**
 * Ottiene un provider per una specifica chain
 * @param {number} chainId - ID della chain
 * @param {object} options - Opzioni per il provider
 * @returns {Promise<ethers.JsonRpcProvider>} Provider configurato
 */
async function getProvider(chainId, options = {}) {
  // Usa il nuovo provider manager se la chain è supportata
  if (isChainSupportedManager(chainId)) {
    return await getProviderManager(chainId, options);
  }
  
  // Fallback al vecchio sistema per chain non supportate dal nuovo manager
  if (!rpcUrls[chainId]) {
    throw new Error(`RPC URL non configurato per chainId: ${chainId}`);
  }
  
  const rpcUrl = rpcUrls[chainId];
  const chainData = chainInfo[chainId];
  
  return new JsonRpcProvider(rpcUrl, {
    name: chainData?.name || `chain-${chainId}`,
    chainId: chainId
  });
}

/**
 * Ottiene informazioni su una chain
 * @param {number} chainId - ID della chain
 * @returns {object} Informazioni della chain
 */
function getChainInfo(chainId) {
  // Usa il nuovo provider manager se la chain è supportata
  if (isChainSupportedManager(chainId)) {
    return getChainInfoManager(chainId);
  }
  
  // Fallback al vecchio sistema
  if (!chainInfo[chainId]) {
    throw new Error(`Chain non supportata: ${chainId}`);
  }
  return chainInfo[chainId];
}

/**
 * Ottiene gli indirizzi dei contratti Aave per una chain
 * @param {number} chainId - ID della chain
 * @returns {object} Indirizzi dei contratti
 */
function getAaveContracts(chainId) {
  // Usa il nuovo provider manager se la chain è supportata
  if (isChainSupportedManager(chainId)) {
    return getAaveContractsManager(chainId);
  }
  
  // Fallback al vecchio sistema
  if (!aaveContracts[chainId]) {
    throw new Error(`Contratti Aave non disponibili per chainId: ${chainId}`);
  }
  return aaveContracts[chainId];
}

/**
 * Ottiene tutti i provider configurati
 * @param {object} options - Opzioni per i provider
 * @returns {Promise<object>} Oggetto con chainId come chiave e provider come valore
 */
async function getAllProviders(options = {}) {
  // Usa il nuovo provider manager per le chain supportate
  const newManagerProviders = await getAllProvidersManager(options);
  
  // Aggiungi provider per chain non supportate dal nuovo manager
  const allProviders = { ...newManagerProviders };
  
  for (const chainId of Object.keys(rpcUrls)) {
    const chainIdNum = parseInt(chainId);
    if (!isChainSupportedManager(chainIdNum)) {
      try {
        allProviders[chainIdNum] = await getProvider(chainIdNum, options);
      } catch (error) {
        console.warn(`Impossibile creare provider per chain ${chainId}:`, error.message);
      }
    }
  }
  
  return allProviders;
}

/**
 * Verifica se una chain è supportata
 * @param {number} chainId - ID della chain
 * @returns {boolean} True se supportata
 */
function isChainSupported(chainId) {
  return isChainSupportedManager(chainId) || chainId in rpcUrls;
}

/**
 * Ottiene la lista delle chain supportate
 * @returns {Array} Array di oggetti con chainId e informazioni
 */
function getSupportedChains() {
  // Combina le chain del nuovo manager con quelle del vecchio sistema
  const newManagerChains = getSupportedChainsManager();
  const oldSystemChains = Object.keys(chainInfo)
    .filter(chainId => !isChainSupportedManager(parseInt(chainId)))
    .map(chainId => ({
      chainId: parseInt(chainId),
      ...chainInfo[chainId]
    }));
  
  return [...newManagerChains, ...oldSystemChains];
}

/**
 * Testa la connessione a una chain
 * @param {number} chainId - ID della chain
 * @returns {Promise<boolean>} True se connesso
 */
async function testConnection(chainId) {
  // Usa il nuovo provider manager se la chain è supportata
  if (isChainSupportedManager(chainId)) {
    return await testConnectionManager(chainId);
  }
  
  // Fallback al vecchio sistema
  try {
    const provider = await getProvider(chainId);
    const network = await provider.getNetwork();
    return network.chainId === chainId;
  } catch (error) {
    console.error(`Errore connessione chain ${chainId}:`, error.message);
    return false;
  }
}

/**
 * Testa tutte le connessioni
 * @returns {Promise<object>} Risultati dei test
 */
async function testAllConnections() {
  // Usa il nuovo provider manager per le chain supportate
  const newManagerResults = await testAllConnectionsManager();
  
  // Testa le chain non supportate dal nuovo manager
  const oldSystemResults = {};
  for (const chainId of Object.keys(rpcUrls)) {
    const chainIdNum = parseInt(chainId);
    if (!isChainSupportedManager(chainIdNum)) {
      oldSystemResults[chainIdNum] = await testConnection(chainIdNum);
    }
  }
  
  return { ...newManagerResults, ...oldSystemResults };
}

export {
  getProvider,
  getChainInfo,
  getAaveContracts,
  getAllProviders,
  isChainSupported,
  getSupportedChains,
  testConnection,
  testAllConnections,
  rpcUrls,
  chainInfo,
  aaveContracts
};
