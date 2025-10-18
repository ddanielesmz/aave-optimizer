// Helper functions per interagire con Aave V3 subgraph
import { isAaveSupported } from './aaveConfig';

// Endpoints subgraph (usati solo come fallback). Default: proxy API interna per evitare CORS
const SUBGRAPH_ENDPOINTS = {
  1: 'https://api.thegraph.com/subgraphs/name/aave/aave-v3-ethereum',
  137: 'https://api.thegraph.com/subgraphs/name/aave/aave-v3-polygon',
  10: 'https://api.thegraph.com/subgraphs/name/aave/aave-v3-optimism',
  42161: 'https://api.thegraph.com/subgraphs/name/aave/aave-v3-arbitrum',
  43114: 'https://api.thegraph.com/subgraphs/name/aave/aave-v3-avalanche'
};

// Stablecoin addresses per rete
const STABLECOIN_ADDRESSES = {
  1: {
    USDC: '0xA0b86a33E6441b8C4C8C0C4C8C0C4C8C0C4C8C0C',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    GUSD: '0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd'
  },
  137: {
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
  },
  10: {
    USDC: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  },
  42161: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  },
  43114: {
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    DAI: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70'
  }
};

// Query GraphQL per ottenere le posizioni di supply dell'utente
const USER_SUPPLY_POSITIONS_QUERY = `
  query GetUserSupplyPositions($userAddress: String!) {
    userReserves(where: { user: $userAddress, currentATokenBalance_gt: "0" }) {
      id
      currentATokenBalance
      reserve {
        id
        symbol
        name
        underlyingAsset
        liquidityRate
        aToken {
          id
        }
      }
    }
  }
`;

// Query GraphQL per ottenere tutti i stablecoin supportati con APY
const STABLECOIN_APY_QUERY = `
  query GetStablecoinAPYs {
    reserves(where: { symbol_in: ["USDC", "USDT", "DAI", "GUSD"] }) {
      id
      symbol
      name
      underlyingAsset
      liquidityRate
      isActive
      usageAsCollateralEnabled
    }
  }
`;

/**
 * Ottiene l'endpoint subgraph per una chain ID
 */
export function getSubgraphEndpoint(chainId) {
  if (!isAaveSupported(chainId)) {
    throw new Error(`Chain ${chainId} not supported by Aave`);
  }
  return SUBGRAPH_ENDPOINTS[chainId];
}

/**
 * Ottiene gli indirizzi degli stablecoin per una chain ID
 */
export function getStablecoinAddresses(chainId) {
  if (!isAaveSupported(chainId)) {
    throw new Error(`Chain ${chainId} not supported by Aave`);
  }
  return STABLECOIN_ADDRESSES[chainId] || {};
}

/**
 * Esegue una query GraphQL al subgraph di Aave
 */
export async function queryAaveSubgraph(endpoint, query, variables = {}, chainId = null) {
  try {
    // Tenta prima passando per l'API interna (evita CORS su client)
    const target = typeof window !== 'undefined' && chainId
      ? '/api/aave/subgraph'
      : endpoint;

    const body = typeof window !== 'undefined' && chainId
      ? { chainId, query, variables }
      : { query, variables };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  } catch (error) {
    console.error('Error querying Aave subgraph:', error);
    throw error;
  }
}

/**
 * Ottiene le posizioni di supply dell'utente per stablecoin
 */
export async function getUserStablecoinSupplyPositions(userAddress, chainId) {
  if (!userAddress || !chainId) {
    throw new Error('User address and chain ID are required');
  }

  const endpoint = getSubgraphEndpoint(chainId);
  const stablecoinAddresses = getStablecoinAddresses(chainId);
  const stablecoinAddressList = Object.values(stablecoinAddresses);

  try {
    const data = await queryAaveSubgraph(endpoint, USER_SUPPLY_POSITIONS_QUERY, {
      userAddress: userAddress.toLowerCase()
    }, chainId);

    // Filtra solo le posizioni di stablecoin con balance > 0
    const stablecoinPositions = data.userReserves.filter(userReserve => {
      const underlyingAsset = userReserve.reserve.underlyingAsset.toLowerCase();
      const hasStablecoinBalance = parseFloat(userReserve.currentATokenBalance) > 0;
      const isStablecoin = stablecoinAddressList.some(addr => 
        addr.toLowerCase() === underlyingAsset
      );
      
      return isStablecoin && hasStablecoinBalance;
    });

    return stablecoinPositions.map(position => ({
      id: position.id,
      symbol: position.reserve.symbol,
      name: position.reserve.name,
      underlyingAsset: position.reserve.underlyingAsset,
      currentBalance: parseFloat(position.currentATokenBalance),
      currentAPY: parseFloat(position.reserve.liquidityRate) / 1e25, // Convert from ray to percentage
      aTokenAddress: position.reserve.aToken.id
    }));
  } catch (error) {
    console.error('Error fetching user stablecoin positions:', error);
    throw error;
  }
}

/**
 * Ottiene gli APY di tutti gli stablecoin supportati sulla rete
 */
export async function getAllStablecoinAPYs(chainId) {
  if (!chainId) {
    throw new Error('Chain ID is required');
  }

  const endpoint = getSubgraphEndpoint(chainId);
  const stablecoinAddresses = getStablecoinAddresses(chainId);
  const stablecoinSymbols = Object.keys(stablecoinAddresses);

  try {
    const data = await queryAaveSubgraph(endpoint, STABLECOIN_APY_QUERY, {}, chainId);

    // Filtra solo gli stablecoin supportati e attivi
    const stablecoinAPYs = data.reserves.filter(reserve => {
      const isSupportedStablecoin = stablecoinSymbols.includes(reserve.symbol);
      const isActive = reserve.isActive;
      const hasCollateralEnabled = reserve.usageAsCollateralEnabled;
      
      return isSupportedStablecoin && isActive && hasCollateralEnabled;
    });

    return stablecoinAPYs.map(reserve => ({
      symbol: reserve.symbol,
      name: reserve.name,
      underlyingAsset: reserve.underlyingAsset,
      apy: parseFloat(reserve.liquidityRate) / 1e25, // Convert from ray to percentage
      isActive: reserve.isActive,
      usageAsCollateralEnabled: reserve.usageAsCollateralEnabled
    }));
  } catch (error) {
    console.error('Error fetching stablecoin APYs:', error);
    throw error;
  }
}

/**
 * Trova la migliore alternativa APY per una posizione di supply
 */
export function findBestAlternativeAPY(currentPosition, allAPYs, minImprovement = 0.1) {
  const currentAPY = currentPosition.currentAPY;
  const currentSymbol = currentPosition.symbol;

  // Filtra le alternative (escludi il token corrente)
  const alternatives = allAPYs.filter(apy => 
    apy.symbol !== currentSymbol && 
    apy.apy > currentAPY + minImprovement
  );

  if (alternatives.length === 0) {
    return null;
  }

  // Trova l'alternativa con APY più alto
  const bestAlternative = alternatives.reduce((best, current) => 
    current.apy > best.apy ? current : best
  );

  return {
    symbol: bestAlternative.symbol,
    apy: bestAlternative.apy,
    improvement: bestAlternative.apy - currentAPY
  };
}

/**
 * Formatta un importo in formato leggibile
 */
export function formatAmount(amount, decimals = 2) {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(decimals)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(decimals)}K`;
  } else {
    return amount.toFixed(decimals);
  }
}

/**
 * Formatta un APY in percentuale
 */
export function formatAPY(apy, decimals = 2) {
  return `${(apy * 100).toFixed(decimals)}%`;
}
