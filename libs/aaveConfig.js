import { 
  getProvider, 
  getChainInfo, 
  getAaveContracts, 
  isChainSupported,
  RPC_CONFIG,
  AAVE_CONTRACTS
} from './providerManager.js';

// Configurazione per browser vs Node.js
const isBrowser = typeof window !== 'undefined';

// Funzione per ottenere le variabili d'ambiente in modo sicuro
function getEnvVar(key, defaultValue) {
  if (isBrowser) {
    return defaultValue;
  }
  return process.env[key] || defaultValue;
}

// Configurazione Aave per diverse reti (per compatibilità)
// Ora utilizza la configurazione centralizzata dal providerManager
export const AAVE_NETWORK_CONFIG = {
  // Ethereum Mainnet
  1: {
    name: 'mainnet',
    rpcUrl: getEnvVar('RPC_URL_ETHEREUM', 'https://cloudflare-eth.com'),
    poolAddressesProvider: '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e',
    chainName: 'mainnet'
  },
  // Polygon
  137: {
    name: 'polygon',
    rpcUrl: getEnvVar('RPC_URL_POLYGON', 'https://polygon-rpc.com'),
    poolAddressesProvider: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    chainName: 'polygon'
  },
  // Optimism
  10: {
    name: 'optimism',
    rpcUrl: getEnvVar('RPC_URL_OPTIMISM', 'https://mainnet.optimism.io'),
    poolAddressesProvider: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    chainName: 'optimism'
  },
  // Arbitrum
  42161: {
    name: 'arbitrum',
    rpcUrl: getEnvVar('RPC_URL_ARBITRUM', 'https://arb1.arbitrum.io/rpc'),
    rpcUrls: [
      getEnvVar('RPC_URL_ARBITRUM', null),
      'https://arb1.arbitrum.io/rpc',
      'https://rpc.ankr.com/arbitrum',
      'https://arbitrum.publicnode.com'
    ].filter(Boolean),
    poolAddressesProvider: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    chainName: 'arbitrum'
  },
  // Base
  8453: {
    name: 'base',
    rpcUrl: process.env.RPC_URL_BASE || 'https://mainnet.base.org',
    poolAddressesProvider: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    chainName: 'base'
  },
  // Avalanche
  43114: {
    name: 'avalanche',
    rpcUrl: getEnvVar('RPC_URL_AVALANCHE', 'https://api.avax.network/ext/bc/C/rpc'),
    poolAddressesProvider: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    chainName: 'avalanche'
  },
  // BSC
  56: {
    name: 'bnb',
    rpcUrl: process.env.RPC_URL_BSC || 'https://bsc-dataseed.binance.org',
    poolAddressesProvider: '0xff75A4B698E3Ec95E608ac0f22A03B8368E05F5D',
    chainName: 'bnb'
  }
};

// Funzione per ottenere la configurazione Aave per una chain ID
export function getAaveConfig(chainId) {
  // Usa la configurazione centralizzata se disponibile
  if (isChainSupported(chainId)) {
    const chainInfo = getChainInfo(chainId);
    const aaveContracts = getAaveContracts(chainId);
    
    return {
      name: chainInfo.name.toLowerCase(),
      rpcUrl: chainInfo.rpcUrl,
      rpcUrls: chainInfo.rpcUrls,
      poolAddressesProvider: aaveContracts.LENDING_POOL_ADDRESS_PROVIDER,
      chainName: chainInfo.name.toLowerCase()
    };
  }
  
  // Fallback alla configurazione legacy
  return AAVE_NETWORK_CONFIG[chainId] || null;
}

// Funzione per verificare se una rete è supportata
export function isAaveSupported(chainId) {
  // Usa la configurazione centralizzata se disponibile
  if (isChainSupported(chainId)) {
    return true;
  }
  
  // Fallback alla configurazione legacy
  return chainId in AAVE_NETWORK_CONFIG;
}

// Lista delle reti supportate
export function getSupportedAaveNetworks() {
  // Combina le reti del provider manager con quelle legacy
  const supportedChains = [];
  
  // Aggiungi reti dal provider manager
  if (typeof getSupportedChains === 'function') {
    const providerChains = getSupportedChains();
    supportedChains.push(...providerChains.map(chain => ({
      chainId: chain.chainId,
      name: chain.name.toLowerCase(),
      rpcUrl: chain.rpcUrl,
      rpcUrls: chain.rpcUrls,
      poolAddressesProvider: getAaveContracts(chain.chainId)?.LENDING_POOL_ADDRESS_PROVIDER,
      chainName: chain.name.toLowerCase()
    })));
  }
  
  // Aggiungi reti legacy non coperte dal provider manager
  Object.keys(AAVE_NETWORK_CONFIG).forEach(chainId => {
    const chainIdNum = parseInt(chainId);
    if (!isChainSupported(chainIdNum)) {
      supportedChains.push({
        chainId: chainIdNum,
        ...AAVE_NETWORK_CONFIG[chainId]
      });
    }
  });
  
  return supportedChains;
}

// Funzione per ottenere un provider Aave per una chain specifica
export async function getAaveProvider(chainId, options = {}) {
  if (!isAaveSupported(chainId)) {
    throw new Error(`Rete Aave non supportata: ${chainId}`);
  }
  
  return await getProvider(chainId, options);
}

// Funzione per ottenere i contratti Aave per una chain
export function getAaveContractsForChain(chainId) {
  if (!isAaveSupported(chainId)) {
    throw new Error(`Rete Aave non supportata: ${chainId}`);
  }
  
  return getAaveContracts(chainId);
}
