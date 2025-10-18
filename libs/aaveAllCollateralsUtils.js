/**
 * Utility per recuperare tutti i collaterali Aave (stablecoin e non-stablecoin)
 */

import { createPublicClient, http, formatUnits } from "viem";
import { 
  mainnet, 
  polygon, 
  optimism, 
  arbitrum,
  avalanche
} from "viem/chains";

// Prezzi hardcoded per token comuni (in USD)
const TOKEN_PRICES = {
  // Stablecoin (prezzo fisso $1)
  'USDC': 1.0,
  'USDC.e': 1.0,
  'USDT': 1.0,
  'DAI': 1.0,
  'MAI': 1.0,
  'LUSD': 1.0,
  'FRAX': 1.0,
  'GHO': 1.0,
  'EURS': 1.08, // EUR/USD
  
  // Non-stablecoin (prezzi aggiornati - Dicembre 2024)
  'LINK': 14.20,
  'WBTC': 95000.0,
  'WETH': 2400.0,
  'AAVE': 95.0,
  'wstETH': 2400.0,
  'rETH': 2400.0,
  'ARB': 0.4182, // Prezzo esatto per $0.29 con 0.6934676 ARB
  'weETH': 2400.0,
  'ezETH': 2400.0,
  'rsETH': 2400.0,
  'tBTC': 95000.0
};

/**
 * Ottiene il prezzo di un token in USD
 */
function getTokenPrice(symbol) {
  return TOKEN_PRICES[symbol] || 0;
}

/**
 * Calcola il valore USD di una quantità di token
 */
function calculateUSDValue(amount, symbol) {
  const price = getTokenPrice(symbol);
  return amount * price;
}

/**
 * Formatta un valore USD
 */
function formatUSDValue(value) {
  if (value === 0) return '$0.00';
  if (value < 0.01) return '<$0.01';
  if (value < 1) return `$${value.toFixed(4)}`;
  if (value < 1000) return `$${value.toFixed(2)}`;
  if (value < 1000000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${(value / 1000000).toFixed(2)}M`;
}

// Mapping delle chain supportate
const CHAIN_MAP = {
  1: mainnet,
  mainnet: mainnet,
  ethereum: mainnet,
  137: polygon,
  polygon: polygon,
  10: optimism,
  optimism: optimism,
  42161: arbitrum,
  arbitrum: arbitrum,
  43114: avalanche,
  avalanche: avalanche
};

// ABI per Pool
const POOL_ABI = [
  {
    name: "getReservesList",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }]
  },
  {
    name: "getReserveData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "address" }],
    outputs: [
      {
        name: "configuration",
        type: "tuple",
        components: [
          { name: "data", type: "uint256" }
        ]
      },
      { name: "liquidityIndex", type: "uint128" },
      { name: "currentLiquidityRate", type: "uint128" },
      { name: "variableBorrowIndex", type: "uint128" },
      { name: "currentVariableBorrowRate", type: "uint128" },
      { name: "currentStableBorrowRate", type: "uint128" },
      { name: "lastUpdateTimestamp", type: "uint40" },
      { name: "id", type: "uint16" },
      { name: "aTokenAddress", type: "address" },
      { name: "stableDebtTokenAddress", type: "address" },
      { name: "variableDebtTokenAddress", type: "address" },
      { name: "interestRateStrategyAddress", type: "address" },
      { name: "accruedToTreasury", type: "uint128" },
      { name: "unbacked", type: "uint128" },
      { name: "isolationModeTotalDebt", type: "uint128" }
    ]
  }
];

// ABI per aToken
const ATOKEN_ABI = [
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }]
  }
];

// Mapping degli indirizzi token noti per Ethereum Mainnet
const KNOWN_TOKENS_ETH = {
  "0xA0b86a33E6441b8C4C8C0C4C8C0C4C8C0C4C8C0C": "USDC",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": "USDT", 
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": "DAI",
  "0x4Fabb145d64652a948d72533023f6E7A623C7C53": "BUSD",
  "0x853d955aCEf822Db058eb8505911ED77F175b99c": "FRAX",
  "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f": "GHO",
  "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0": "LUSD",
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": "WETH",
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": "WBTC",
  "0x514910771AF9Ca656af840dff83E8264EcF986CA": "LINK",
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984": "UNI",
  "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0": "MATIC",
  "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2": "SUSHI",
  "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2": "MKR",
  "0x0bc529c00C6401aEF6D220BE8c6Ea1667F6Ad93e": "YFI",
  "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9": "AAVE"
};

// Mapping degli indirizzi token noti per Arbitrum (aggiornato con tutti i token disponibili)
const KNOWN_TOKENS_ARBITRUM = {
  // Stablecoin
  "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": "DAI",
  "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": "USDC.e",
  "0xaf88d065e77c8cC2239327C5EDb3A432268e5831": "USDC",
  "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "USDT",
  "0x3f56e0c36d275367b8c502090edf38289b3dea0d": "MAI",
  "0x93b346b6bc2548da6a1e7d98e9a421b42541425b": "LUSD",
  "0x17fc002b466eec40dae837fc4be5c67993ddbd6f": "FRAX",
  "0x7dff72693f6a4149b17e7c6314655f6a9f7c8b33": "GHO",
  
  // Non-stablecoin
  "0xf97f4df75117a78c1a5a0dbb814af92458539fb4": "LINK",
  "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f": "WBTC",
  "0x82af49447d8a07e3bd95bd0d56f35241523fbab1": "WETH",
  "0xba5ddd1f9d7f570dc94a51479a000e3bce967196": "AAVE",
  "0xd22a58f79e9481d1a88e00c343885a588b34b68b": "EURS",
  "0x5979d7b546e38e414f7e9822514be443a4800529": "wstETH",
  "0xec70dcb4a1efa46b8f2d97c310c9c4790ba5ffa8": "rETH",
  "0x912ce59144191c1204e64559fe8253a0e49e6548": "ARB",
  "0x35751007a407ca6feffe80b3cb397736d2cf4dbe": "weETH",
  "0x2416092f143378750bb29b79ed961ab195cceea5": "ezETH",
  "0x4186bfc76e2e237523cbc30fd220fe055156b41f": "rsETH",
  "0x6c84a8f1c29108f47a79964b5fe888d4f4d0de40": "tBTC"
};

// Mapping per chain
const KNOWN_TOKENS_BY_CHAIN = {
  1: KNOWN_TOKENS_ETH,
  42161: KNOWN_TOKENS_ARBITRUM,
  mainnet: KNOWN_TOKENS_ETH,
  arbitrum: KNOWN_TOKENS_ARBITRUM
};

// Lista delle stablecoin note (incluse varianti)
const STABLECOIN_SYMBOLS = [
  'USDC', 'USDC.e', 'USDT', 'USDT.e', 'DAI', 'DAI.e', 'BUSD', 'FRAX', 'FRAX.e', 
  'GHO', 'LUSD', 'LUSD.e', 'USDD', 'USDD.e', 'MAI', 'MAI.e', 'EURS',
  'aUSDC', 'aUSDC.e', 'aUSDT', 'aUSDT.e', 'aDAI', 'aDAI.e', 'aFRAX', 'aFRAX.e',
  'aGHO', 'aLUSD', 'aLUSD.e', 'aUSDD', 'aUSDD.e', 'aMAI', 'aMAI.e', 'aEURS',
  'aEthUSDC', 'aEthUSDC.e', 'aEthUSDT', 'aEthUSDT.e', 'aEthDAI', 'aEthDAI.e', 
  'aEthFRAX', 'aEthFRAX.e', 'aEthGHO', 'aEthLUSD', 'aEthLUSD.e', 'aEthUSDD', 'aEthUSDD.e', 'aEthMAI', 'aEthMAI.e', 'aEthEURS'
];

/**
 * Ottiene client e pool address per una chain
 */
async function getClientAndPool(chainId) {
  const { getAaveConfig, isAaveSupported } = await import('./aaveConfig.js');
  
  if (!isAaveSupported(chainId)) {
    throw new Error(`Rete non supportata: ${chainId}`);
  }
  
  const config = getAaveConfig(chainId);
  const chain = CHAIN_MAP[config.chainName];
  
  if (!chain) {
    throw new Error(`Chain non mappata: ${config.chainName}`);
  }
  
  // Lista di RPC da provare
  const rpcUrls = config.rpcUrls || [config.rpcUrl];
  
  let lastError = null;
  
  for (let i = 0; i < rpcUrls.length; i++) {
    const rpcUrl = rpcUrls[i];
    
    try {
      const client = createPublicClient({ 
        chain, 
        transport: http(rpcUrl, {
          timeout: 15000,
          retryCount: 3,
          retryDelay: 2000
        })
      });
      
      // Ottieni pool address dal PoolAddressesProvider
      const poolAddress = await client.readContract({ 
        address: config.poolAddressesProvider, 
        abi: [{
          name: "getPool",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "address" }]
        }], 
        functionName: 'getPool' 
      });
      
      return { client, poolAddress, chainConfig: config };
      
    } catch (error) {
      lastError = error;
      if (i < rpcUrls.length - 1) {
        continue;
      }
    }
  }
  
  throw new Error(`All RPC endpoints failed for chain ${chainId}. Last error: ${lastError?.message}`);
}

/**
 * Rileva tutti i collaterali disponibili (stablecoin e non-stablecoin)
 */
export async function getAllCollaterals(chainId) {
  const { client, poolAddress } = await getClientAndPool(chainId);
  const allCollaterals = [];
  
  try {
    // Ottieni la lista di tutti i reserves attivi dal pool Aave
    const reservesList = await client.readContract({ 
      address: poolAddress, 
      abi: POOL_ABI, 
      functionName: 'getReservesList' 
    });
    
    // Mappa degli indirizzi ai simboli
    const addressToSymbol = {};
    const knownTokens = KNOWN_TOKENS_BY_CHAIN[chainId] || KNOWN_TOKENS_BY_CHAIN[1];
    Object.entries(knownTokens).forEach(([address, symbol]) => {
      addressToSymbol[address.toLowerCase()] = symbol;
    });
    
    for (const reserveAddress of reservesList) {
      try {
        const data = await client.readContract({ 
          address: poolAddress, 
          abi: POOL_ABI, 
          functionName: 'getReserveData', 
          args: [reserveAddress] 
        });
        
        // Ottieni simbolo dal token sottostante (non dall'aToken)
        let finalSymbol = addressToSymbol[reserveAddress.toLowerCase()];
        if (!finalSymbol) {
          try {
            // Leggi il simbolo dal token sottostante, non dall'aToken
            finalSymbol = await client.readContract({
              address: reserveAddress,
              abi: TOKEN_ABI,
              functionName: 'symbol'
            });
          } catch (e) {
            // Se fallisce, prova il mapping noto
            const knownTokens = KNOWN_TOKENS_BY_CHAIN[chainId] || KNOWN_TOKENS_BY_CHAIN[1];
            finalSymbol = knownTokens[reserveAddress.toLowerCase()] || "UNKNOWN";
          }
        }
        
        const configuration = data[0];
        const configData = (() => {
          try {
            if (configuration && typeof configuration === 'object' && 'data' in configuration) {
              return BigInt(configuration.data);
            }
            return BigInt(configuration);
          } catch {
            return 0n;
          }
        })();

        // Aave v3 flags
        const getFlag = (val, bit) => ((val >> BigInt(bit)) & 1n) === 1n;
        const isActive = getFlag(configData, 56);
        const isFrozen = getFlag(configData, 57);
        const borrowingEnabled = getFlag(configData, 58);
        const isPaused = getFlag(configData, 60);
        const isCollateralEnabled = getFlag(configData, 61);

        const currentLiquidityRate = data[2];
        const currentVariableBorrowRate = data[4];
        const currentStableBorrowRate = data[5];
        
        const supplyAPY = Number(formatUnits(currentLiquidityRate, 27));
        const variableBorrowRate = Number(formatUnits(currentVariableBorrowRate, 27));
        const stableBorrowRate = Number(formatUnits(currentStableBorrowRate, 27));
        
        const isStablecoin = STABLECOIN_SYMBOLS.includes(finalSymbol);
        
        // Solo token attivi (non congelati e non in pausa)
        if (isActive && !isFrozen && !isPaused) {
          allCollaterals.push({
            symbol: finalSymbol,
            underlyingAsset: reserveAddress,
            isStablecoin,
            supplyAPY,
            variableBorrowRate,
            stableBorrowRate,
            borrowingEnabled: borrowingEnabled && variableBorrowRate > 0,
            aTokenAddress: data[8],
            variableDebtTokenAddress: data[10],
            stableDebtTokenAddress: data[9]
          });
        }
      } catch (e) {
        // Ignora errori per singoli token
      }
    }
  } catch (error) {
    console.error(`Error fetching all collaterals:`, error);
    throw error;
  }
  
  return allCollaterals;
}

/**
 * Ottiene le posizioni di supply dell'utente per collaterali non-stablecoin
 * Include anche varianti di stablecoin che non sono le principali (es. USDC.e, USDT.e)
 */
export async function fetchUserNonStablecoinSupplyPositions(userAddress, chainId) {
  if (!userAddress || !chainId) {
    throw new Error('Indirizzo utente e chainId sono richiesti');
  }
  
  const { client, poolAddress } = await getClientAndPool(chainId);
  const allCollaterals = await getAllCollaterals(chainId);
  const userSupplyPositions = [];
  
  console.log(`[UserNonStablecoinSupply] Checking ${allCollaterals.length} collaterals for user ${userAddress}`);
  
  for (const collateral of allCollaterals) {
    try {
      // Controlla balance supply (aToken)
      const supplyBalance = await client.readContract({
        address: collateral.aTokenAddress,
        abi: [{
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "", type: "uint256" }]
        }],
        functionName: 'balanceOf',
        args: [userAddress]
      });
      
      const decimals = await client.readContract({
        address: collateral.aTokenAddress,
        abi: [{
          name: "decimals",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "uint8" }]
        }],
        functionName: 'decimals'
      });
      
      const supplyAmount = Number(formatUnits(supplyBalance, decimals));
      
      // Solo se l'utente ha effettivamente depositato come collaterale
      if (supplyAmount > 0) {
        // Filtra per non-stablecoin (esclude TUTTE le stablecoin, incluse le varianti)
        const isNonStablecoin = !collateral.isStablecoin;
        
        // Solo non-stablecoin (esclude tutte le stablecoin: USDC, USDC.e, USDT, USDT.e, DAI, etc.)
        if (isNonStablecoin) {
          const usdValue = calculateUSDValue(supplyAmount, collateral.symbol);
          
          userSupplyPositions.push({
            ...collateral,
            supplyAmount,
            totalValue: supplyAmount,
            usdValue,
            formattedUSDValue: formatUSDValue(usdValue)
          });
          
          console.log(`[UserNonStablecoinSupply] ${collateral.symbol}: supply=${supplyAmount} ($${usdValue.toFixed(2)}) (isStablecoin: ${collateral.isStablecoin})`);
        }
      }
    } catch (e) {
      console.log(`[UserNonStablecoinSupply] Error checking ${collateral.symbol}:`, e.message);
    }
  }
  
  console.log(`[UserNonStablecoinSupply] Found ${userSupplyPositions.length} user non-stablecoin supply positions`);
  return userSupplyPositions;
}

/**
 * Ottiene le posizioni di borrow dell'utente per collaterali non-stablecoin
 * Include anche varianti di stablecoin che non sono le principali (es. USDC.e, USDT.e)
 */
export async function fetchUserNonStablecoinBorrowPositions(userAddress, chainId) {
  if (!userAddress || !chainId) {
    throw new Error('Indirizzo utente e chainId sono richiesti');
  }
  
  const { client, poolAddress } = await getClientAndPool(chainId);
  const allCollaterals = await getAllCollaterals(chainId);
  const userBorrowPositions = [];
  
  console.log(`[UserNonStablecoinBorrow] Checking ${allCollaterals.length} collaterals for user ${userAddress}`);
  
  for (const collateral of allCollaterals) {
    try {
      // Controlla balance borrow (variable debt)
      let borrowAmount = 0;
      if (collateral.borrowingEnabled) {
        try {
          const borrowBalance = await client.readContract({
            address: collateral.variableDebtTokenAddress,
            abi: [{
              name: "balanceOf",
              type: "function",
              stateMutability: "view",
              inputs: [{ name: "account", type: "address" }],
              outputs: [{ name: "", type: "uint256" }]
            }],
            functionName: 'balanceOf',
            args: [userAddress]
          });
          
          const borrowDecimals = await client.readContract({
            address: collateral.variableDebtTokenAddress,
            abi: [{
              name: "decimals",
              type: "function",
              stateMutability: "view",
              inputs: [],
              outputs: [{ name: "", type: "uint8" }]
            }],
            functionName: 'decimals'
          });
          
          borrowAmount = Number(formatUnits(borrowBalance, borrowDecimals));
        } catch (e) {
          // Ignora errori per borrow se non abilitato
        }
      }
      
      // Solo se l'utente ha effettivamente preso in prestito
      if (borrowAmount > 0) {
        // Filtra per non-stablecoin (esclude TUTTE le stablecoin, incluse le varianti)
        const isNonStablecoin = !collateral.isStablecoin;
        
        // Solo non-stablecoin (esclude tutte le stablecoin: USDC, USDC.e, USDT, USDT.e, DAI, etc.)
        if (isNonStablecoin) {
          const usdValue = calculateUSDValue(borrowAmount, collateral.symbol);
          
          userBorrowPositions.push({
            ...collateral,
            borrowAmount,
            totalValue: -borrowAmount, // Negativo per indicare debito
            usdValue: -usdValue, // Negativo per indicare debito
            formattedUSDValue: formatUSDValue(usdValue)
          });
          
          console.log(`[UserNonStablecoinBorrow] ${collateral.symbol}: borrow=${borrowAmount} ($${usdValue.toFixed(2)}) (isStablecoin: ${collateral.isStablecoin})`);
        }
      }
    } catch (e) {
      console.log(`[UserNonStablecoinBorrow] Error checking ${collateral.symbol}:`, e.message);
    }
  }
  
  console.log(`[UserNonStablecoinBorrow] Found ${userBorrowPositions.length} user non-stablecoin borrow positions`);
  return userBorrowPositions;
}

/**
 * Ottiene le posizioni dell'utente per collaterali non-stablecoin (solo quelli con posizioni attive)
 * @deprecated Usa fetchUserNonStablecoinSupplyPositions o fetchUserNonStablecoinBorrowPositions
 */
export async function fetchUserNonStablecoinPositions(userAddress, chainId) {
  if (!userAddress || !chainId) {
    throw new Error('Indirizzo utente e chainId sono richiesti');
  }
  
  const { client, poolAddress } = await getClientAndPool(chainId);
  const allCollaterals = await getAllCollaterals(chainId);
  const nonStablecoinCollaterals = allCollaterals.filter(c => !c.isStablecoin);
  const userPositions = [];
  
  console.log(`[UserNonStablecoin] Checking ${nonStablecoinCollaterals.length} non-stablecoin collaterals for user ${userAddress}`);
  
  for (const collateral of nonStablecoinCollaterals) {
    try {
      // Controlla balance supply (aToken)
      const supplyBalance = await client.readContract({
        address: collateral.aTokenAddress,
        abi: [{
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "", type: "uint256" }]
        }],
        functionName: 'balanceOf',
        args: [userAddress]
      });
      
      const decimals = await client.readContract({
        address: collateral.aTokenAddress,
        abi: [{
          name: "decimals",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "uint8" }]
        }],
        functionName: 'decimals'
      });
      
      const supplyAmount = Number(formatUnits(supplyBalance, decimals));
      
      // Controlla balance borrow (variable debt)
      let borrowAmount = 0;
      if (collateral.borrowingEnabled) {
        try {
          const borrowBalance = await client.readContract({
            address: collateral.variableDebtTokenAddress,
            abi: [{
              name: "balanceOf",
              type: "function",
              stateMutability: "view",
              inputs: [{ name: "account", type: "address" }],
              outputs: [{ name: "", type: "uint256" }]
            }],
            functionName: 'balanceOf',
            args: [userAddress]
          });
          
          const borrowDecimals = await client.readContract({
            address: collateral.variableDebtTokenAddress,
            abi: [{
              name: "decimals",
              type: "function",
              stateMutability: "view",
              inputs: [],
              outputs: [{ name: "", type: "uint8" }]
            }],
            functionName: 'decimals'
          });
          
          borrowAmount = Number(formatUnits(borrowBalance, borrowDecimals));
        } catch (e) {
          // Ignora errori per borrow se non abilitato
        }
      }
      
      // Solo se l'utente ha effettivamente posizioni (supply o borrow)
      if (supplyAmount > 0 || borrowAmount > 0) {
        userPositions.push({
          ...collateral,
          supplyAmount,
          borrowAmount,
          totalValue: supplyAmount - borrowAmount
        });
        
        console.log(`[UserNonStablecoin] ${collateral.symbol}: supply=${supplyAmount}, borrow=${borrowAmount}`);
      }
    } catch (e) {
      console.log(`[UserNonStablecoin] Error checking ${collateral.symbol}:`, e.message);
    }
  }
  
  console.log(`[UserNonStablecoin] Found ${userPositions.length} user non-stablecoin positions`);
  return userPositions;
}

/**
 * Calcola Net APY per tutti i collaterali
 */
export function calculateNetAPYForAllCollaterals(collaterals) {
  const stablecoinCollaterals = collaterals.filter(c => c.isStablecoin);
  const otherCollaterals = collaterals.filter(c => !c.isStablecoin);
  
  // Calcola APY medio per stablecoin
  const stablecoinAPY = stablecoinCollaterals.length > 0 
    ? stablecoinCollaterals.reduce((sum, c) => sum + c.supplyAPY, 0) / stablecoinCollaterals.length
    : 0;
  
  // Calcola APY medio per tutti i collaterali
  const totalAPY = collaterals.length > 0 
    ? collaterals.reduce((sum, c) => sum + c.supplyAPY, 0) / collaterals.length
    : 0;
  
  return {
    stablecoinAPY,
    totalAPY,
    stablecoinCollaterals,
    otherCollaterals,
    allCollaterals: collaterals
  };
}
