#!/usr/bin/env node

/**
 * Aave V3 APY Analyzer
 * 
 * Analizza i dati APY su Aave V3 per tutte le reti supportate:
 * - Ethereum Mainnet
 * - Polygon
 * - Optimism  
 * - Arbitrum
 * - Avalanche
 * 
 * Per ogni token fornisce:
 * - Nome del token e simbolo
 * - Decimals
 * - Liquidity rate (supply rate)
 * - Variable borrow rate
 * - Stable borrow rate
 * - Net APY calcolato
 * - Total supply e total borrow
 * - Block number della lettura
 * 
 * @author DeFi Dashboard Team
 * @version 1.0.0
 */

import { createPublicClient, http, formatUnits } from "viem";
import { 
  mainnet, 
  polygon, 
  optimism, 
  arbitrum,
  avalanche
} from "viem/chains";
import { getAaveConfig, isAaveSupported } from "../libs/aaveConfig.js";

// Mapping delle chain supportate
const CHAIN_MAP = {
  mainnet: mainnet,
  ethereum: mainnet, // Alias per compatibilità
  polygon: polygon,
  optimism: optimism,
  arbitrum: arbitrum,
  avalanche: avalanche
};

// ABI per PoolAddressesProvider
const PAD_ABI = [
  {
    name: "getPool",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  }
];

// ABI per Pool - getReserveData
const POOL_ABI = [
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
  },
  {
    name: "getReservesList",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }]
  }
];

// ABI per token (aToken, debtToken)
const TOKEN_ABI = [
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }]
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }]
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "scaledTotalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  }
];

// Mapping degli indirizzi dei token principali per ogni chain
const TOKEN_ADDRESSES_BY_CHAIN = {
  1: { // Ethereum Mainnet
    USDC: "0xA0b86a33E6441b8C4C8C0C4C8C0C4C8C0C4C8C0C", // Placeholder - da correggere
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    USDP: "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
    TUSD: "0x0000000000000000000000000000000000000000", // Non disponibile su Ethereum
    FRAX: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    LUSD: "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
    GHO: "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f"
  },
  137: { // Polygon
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    USDP: "0x0000000000000000000000000000000000000000", // Non disponibile su Polygon
    TUSD: "0x2e1AD108fF1D7C164c6e71D2C1e3E2180171B315",
    FRAX: "0x45c32fA6DF82ead1e2EF74d17b76547EDdFaFF89",
    LUSD: "0x23001f892c0CbD2E6e3f46d35f7a8f7C59a6c7D6",
    GHO: "0x0000000000000000000000000000000000000000" // Non disponibile su Polygon
  },
  10: { // Optimism
    USDC: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    WETH: "0x4200000000000000000000000000000000000006",
    WBTC: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
    USDP: "0x0000000000000000000000000000000000000000", // Non disponibile su Optimism
    TUSD: "0x0000000000000000000000000000000000000000", // Non disponibile su Optimism
    FRAX: "0x0000000000000000000000000000000000000000", // Non disponibile su Optimism
    LUSD: "0x0000000000000000000000000000000000000000", // Non disponibile su Optimism
    GHO: "0x0000000000000000000000000000000000000000" // Non disponibile su Optimism
  },
  42161: { // Arbitrum
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "USDC.e": "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
    ARB: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    USDP: "0x0000000000000000000000000000000000000000", // Non disponibile su Arbitrum
    TUSD: "0x0000000000000000000000000000000000000000", // Non disponibile su Arbitrum
    FRAX: "0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F",
    LUSD: "0x93b346b6BC2548dA6A1E7d98E9a421B42541425b",
    GHO: "0x08bdd4f0046123adc2466495775ff02255694a16"
  },
  43114: { // Avalanche
    USDC: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    USDT: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
    DAI: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
    WETH: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
    WBTC: "0x50b7545627a5162F82A992c33b87aDc75187B218",
    WAVAX: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    USDP: "0x0000000000000000000000000000000000000000", // Non disponibile su Avalanche
    TUSD: "0x0000000000000000000000000000000000000000", // Non disponibile su Avalanche
    FRAX: "0xD24C2Ad096000BAbB5Dd4adF3ba4CA8311A46B2",
    LUSD: "0x0000000000000000000000000000000000000000", // Non disponibile su Avalanche
    GHO: "0x0000000000000000000000000000000000000000" // Non disponibile su Avalanche
  }
};

// Lista dei token principali da analizzare
const MAIN_TOKENS = ['USDC', 'USDC.e', 'USDT', 'DAI', 'WETH', 'WBTC', 'ARB', 'WMATIC', 'WAVAX', 'USDP', 'TUSD', 'FRAX', 'LUSD', 'GHO'];

/**
 * Ottiene client viem e indirizzo Pool per una chain
 */
async function getClientAndPool(chainId) {
  if (!isAaveSupported(chainId)) {
    throw new Error(`Rete non supportata: ${chainId}`);
  }

  const config = getAaveConfig(chainId);
  if (!config) {
    throw new Error(`Configurazione Aave mancante per la rete ${chainId}`);
  }

  const chain = CHAIN_MAP[config.chainName];
  if (!chain) {
    throw new Error(`Chain non mappata: ${config.chainName}`);
  }

  // Lista di RPC da provare
  let rpcUrls = config.rpcUrls || [config.rpcUrl];
  
  // Aggiungi RPC pubblici più affidabili per Ethereum
  if (chainId === 1) {
    rpcUrls = [
      'https://ethereum.publicnode.com',
      'https://rpc.ankr.com/eth',
      'https://eth.llamarpc.com',
      'https://ethereum-rpc.publicnode.com',
      ...rpcUrls
    ];
  }
  
  let lastError = null;
  
  for (let i = 0; i < rpcUrls.length; i++) {
    const rpcUrl = rpcUrls[i];
    
    try {
      console.log(`🔄 Tentativo RPC ${i + 1}/${rpcUrls.length}: ${rpcUrl}`);
      
      const client = createPublicClient({ 
        chain, 
        transport: http(rpcUrl, {
          timeout: 15000,
          retryCount: 3,
          retryDelay: 2000
        })
      });
      
      const poolAddress = await client.readContract({ 
        address: config.poolAddressesProvider, 
        abi: PAD_ABI, 
        functionName: 'getPool' 
      });
      
      console.log(`✅ Successo con RPC: ${rpcUrl}`);
      console.log(`🔧 Pool Address: ${poolAddress} (Chain: ${chainId})`);
      
      return { client, poolAddress, chainConfig: config };
      
    } catch (error) {
      console.error(`❌ Fallito con RPC ${rpcUrl}:`, error.message);
      lastError = error;
      
      if (i < rpcUrls.length - 1) {
        console.log(`🔄 Riprovo con il prossimo RPC...`);
        continue;
      }
    }
  }
  
  throw new Error(`Tutti gli endpoint RPC falliti per chain ${chainId}. Ultimo errore: ${lastError?.message}`);
}

/**
 * Ottiene informazioni dettagliate del token
 */
async function getTokenInfo(client, tokenAddress) {
  try {
    const [symbol, decimals] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: TOKEN_ABI,
        functionName: 'symbol'
      }),
      client.readContract({
        address: tokenAddress,
        abi: TOKEN_ABI,
        functionName: 'decimals'
      })
    ]);
    
    return { symbol, decimals };
  } catch (error) {
    console.warn(`⚠️ Errore nel leggere info token ${tokenAddress}:`, error.message);
    return { symbol: 'UNKNOWN', decimals: 18 };
  }
}

/**
 * Ottiene total supply e total borrow per un token
 */
async function getTokenSupplyAndBorrow(client, reserveData) {
  try {
    const aTokenAddress = reserveData[8]; // aTokenAddress
    const variableDebtTokenAddress = reserveData[10]; // variableDebtTokenAddress
    const stableDebtTokenAddress = reserveData[9]; // stableDebtTokenAddress
    
    // Ottieni total supply (scaled total supply dell'aToken)
    const [totalSupply, variableDebtTotal, stableDebtTotal] = await Promise.all([
      client.readContract({
        address: aTokenAddress,
        abi: TOKEN_ABI,
        functionName: 'scaledTotalSupply'
      }).catch(() => 0n),
      client.readContract({
        address: variableDebtTokenAddress,
        abi: TOKEN_ABI,
        functionName: 'scaledTotalSupply'
      }).catch(() => 0n),
      client.readContract({
        address: stableDebtTokenAddress,
        abi: TOKEN_ABI,
        functionName: 'scaledTotalSupply'
      }).catch(() => 0n)
    ]);
    
    return {
      totalSupply: totalSupply.toString(),
      totalVariableDebt: variableDebtTotal.toString(),
      totalStableDebt: stableDebtTotal.toString(),
      totalBorrow: (variableDebtTotal + stableDebtTotal).toString()
    };
  } catch (error) {
    console.warn(`⚠️ Errore nel leggere supply/borrow:`, error.message);
    return {
      totalSupply: "0",
      totalVariableDebt: "0", 
      totalStableDebt: "0",
      totalBorrow: "0"
    };
  }
}

/**
 * Analizza i dati APY per una singola chain
 */
async function analyzeChainAPY(chainId) {
  console.log(`\n🔍 Analisi APY per Chain ID: ${chainId}`);
  console.log(`=====================================`);
  
  try {
    const { client, poolAddress, chainConfig } = await getClientAndPool(chainId);
    const blockNumber = await client.getBlockNumber();
    
    console.log(`📊 Block Number: ${blockNumber}`);
    console.log(`🌐 Chain: ${chainConfig.name}`);
    
    // Ottieni lista delle riserve attive
    const reservesList = await client.readContract({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: 'getReservesList'
    });
    
    console.log(`📋 Trovate ${reservesList.length} riserve attive`);
    
    const results = [];
    
    // Analizza ogni riserva (TUTTE le riserve invece di filtrarle)
    for (const reserveAddress of reservesList) {
      console.log(`\n🔍 Analizzando riserva: ${reserveAddress}`);
      
      try {
        // Ottieni dati della riserva
        const reserveData = await client.readContract({
          address: poolAddress,
          abi: POOL_ABI,
          functionName: 'getReserveData',
          args: [reserveAddress]
        });
        
        // Estrai i dati
        const configuration = reserveData[0];
        const liquidityIndex = reserveData[1];
        const currentLiquidityRate = reserveData[2];
        const variableBorrowIndex = reserveData[3];
        const currentVariableBorrowRate = reserveData[4];
        const currentStableBorrowRate = reserveData[5];
        const lastUpdateTimestamp = reserveData[6];
        const id = reserveData[7];
        
        // Verifica se la riserva è attiva
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
        
        const getFlag = (val, bit) => ((val >> BigInt(bit)) & 1n) === 1n;
        const isActive = getFlag(configData, 56);
        const isFrozen = getFlag(configData, 57);
        const borrowingEnabled = getFlag(configData, 58);
        const isPaused = getFlag(configData, 60);
        
        if (!isActive || isPaused) {
          console.log(`⏭️ Saltato ${reserveAddress} (non attivo o pausato)`);
          continue;
        }
        
        // Ottieni informazioni del token
        const tokenInfo = await getTokenInfo(client, reserveAddress);
        
        // Ottieni supply e borrow totals
        const supplyBorrowData = await getTokenSupplyAndBorrow(client, reserveData);
        
        // Converti i tassi da ray (27 decimali) a percentuale
        const liquidityRate = Number(formatUnits(currentLiquidityRate, 27));
        const variableBorrowRate = Number(formatUnits(currentVariableBorrowRate, 27));
        const stableBorrowRate = Number(formatUnits(currentStableBorrowRate, 27));
        
        // Calcola Net APY (supply rate - borrow rate)
        const netAPY = liquidityRate - variableBorrowRate;
        
        // Converti supply e borrow usando i decimals del token
        const totalSupplyFormatted = Number(formatUnits(BigInt(supplyBorrowData.totalSupply), tokenInfo.decimals));
        const totalBorrowFormatted = Number(formatUnits(BigInt(supplyBorrowData.totalBorrow), tokenInfo.decimals));
        
        const tokenData = {
          symbol: tokenInfo.symbol,
          name: tokenInfo.symbol, // Per ora usiamo il simbolo come nome
          decimals: tokenInfo.decimals,
          underlyingAsset: reserveAddress,
          liquidityRate: liquidityRate,
          liquidityRatePercentage: (liquidityRate * 100).toFixed(6),
          variableBorrowRate: variableBorrowRate,
          variableBorrowRatePercentage: (variableBorrowRate * 100).toFixed(6),
          stableBorrowRate: stableBorrowRate,
          stableBorrowRatePercentage: (stableBorrowRate * 100).toFixed(6),
          netAPY: netAPY,
          netAPYPercentage: (netAPY * 100).toFixed(6),
          totalSupply: totalSupplyFormatted,
          totalSupplyRaw: supplyBorrowData.totalSupply,
          totalBorrow: totalBorrowFormatted,
          totalBorrowRaw: supplyBorrowData.totalBorrow,
          totalVariableDebt: Number(formatUnits(BigInt(supplyBorrowData.totalVariableDebt), tokenInfo.decimals)),
          totalStableDebt: Number(formatUnits(BigInt(supplyBorrowData.totalStableDebt), tokenInfo.decimals)),
          blockNumber: blockNumber,
          lastUpdateTimestamp: Number(lastUpdateTimestamp),
          isActive: isActive,
          isFrozen: isFrozen,
          borrowingEnabled: borrowingEnabled,
          isPaused: isPaused,
          reserveId: Number(id)
        };
        
        results.push(tokenData);
        
        console.log(`✅ ${tokenInfo.symbol}:`);
        console.log(`   Supply Rate: ${(liquidityRate * 100).toFixed(4)}%`);
        console.log(`   Variable Borrow Rate: ${(variableBorrowRate * 100).toFixed(4)}%`);
        console.log(`   Stable Borrow Rate: ${(stableBorrowRate * 100).toFixed(4)}%`);
        console.log(`   Net APY: ${(netAPY * 100).toFixed(4)}%`);
        console.log(`   Total Supply: ${totalSupplyFormatted.toLocaleString()}`);
        console.log(`   Total Borrow: ${totalBorrowFormatted.toLocaleString()}`);
        
      } catch (error) {
        console.error(`❌ Errore nell'analisi di ${reserveAddress}:`, error.message);
      }
    }
    
    return {
      chainId: chainId,
      chainName: chainConfig.name,
      blockNumber: blockNumber,
      timestamp: new Date().toISOString(),
      tokens: results
    };
    
  } catch (error) {
    console.error(`❌ Errore nell'analisi della chain ${chainId}:`, error.message);
    return {
      chainId: chainId,
      chainName: 'Unknown',
      blockNumber: 0,
      timestamp: new Date().toISOString(),
      error: error.message,
      tokens: []
    };
  }
}

/**
 * Analizza APY per tutte le chain supportate
 */
async function analyzeAllChainsAPY() {
  console.log(`🚀 Avvio analisi APY Aave V3 per tutte le chain supportate`);
  console.log(`========================================================`);
  
  const supportedChains = [1, 137, 10, 42161, 43114]; // Ethereum, Polygon, Optimism, Arbitrum, Avalanche
  const results = [];
  
  for (const chainId of supportedChains) {
    try {
      const chainResult = await analyzeChainAPY(chainId);
      results.push(chainResult);
      
      // Pausa tra le chain per evitare rate limiting
      if (chainId !== supportedChains[supportedChains.length - 1]) {
        console.log(`\n⏳ Pausa di 2 secondi prima della prossima chain...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Errore critico per chain ${chainId}:`, error.message);
      results.push({
        chainId: chainId,
        chainName: 'Unknown',
        blockNumber: 0,
        timestamp: new Date().toISOString(),
        error: error.message,
        tokens: []
      });
    }
  }
  
  return results;
}

/**
 * Genera report di confronto con frontend Aave
 */
function generateComparisonReport(allResults) {
  console.log(`\n📊 REPORT DI CONFRONTO CON FRONTEND AAVE`);
  console.log(`=====================================`);
  
  allResults.forEach(chainResult => {
    if (chainResult.error) {
      console.log(`\n❌ ${chainResult.chainName} (${chainResult.chainId}): ${chainResult.error}`);
      return;
    }
    
    console.log(`\n🌐 ${chainResult.chainName} (${chainResult.chainId}) - Block: ${chainResult.chainResult?.blockNumber || 'N/A'}`);
    console.log(`📋 Trovati ${chainResult.tokens.length} token attivi`);
    
    chainResult.tokens.forEach(token => {
      console.log(`\n💰 ${token.symbol}:`);
      console.log(`   Supply Rate: ${token.liquidityRatePercentage}%`);
      console.log(`   Variable Borrow: ${token.variableBorrowRatePercentage}%`);
      console.log(`   Stable Borrow: ${token.stableBorrowRatePercentage}%`);
      console.log(`   Net APY: ${token.netAPYPercentage}%`);
      console.log(`   Total Supply: ${token.totalSupply.toLocaleString()}`);
      console.log(`   Total Borrow: ${token.totalBorrow.toLocaleString()}`);
      console.log(`   📝 Confronta con: https://app.aave.com/markets/?marketName=proto_${chainResult.chainName}_v3`);
    });
  });
}

/**
 * Salva i risultati in un file JSON
 */
async function saveResultsToFile(results, filename = 'aave-apy-analysis.json') {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const outputPath = path.join(process.cwd(), 'scripts', filename);
  
  try {
    // Converte BigInt in stringhe per la serializzazione JSON
    const serializableResults = JSON.parse(JSON.stringify(results, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    await fs.writeFile(outputPath, JSON.stringify(serializableResults, null, 2));
    console.log(`\n💾 Risultati salvati in: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Errore nel salvare i risultati:`, error.message);
  }
}

/**
 * Funzione principale
 */
async function main() {
  try {
    console.log(`🎯 Aave V3 APY Analyzer v1.0.0`);
    console.log(`===============================`);
    
    // Analizza tutte le chain
    const results = await analyzeAllChainsAPY();
    
    // Genera report di confronto
    generateComparisonReport(results);
    
    // Salva risultati
    await saveResultsToFile(results);
    
    console.log(`\n✅ Analisi completata!`);
    console.log(`📊 Risultati disponibili in: scripts/aave-apy-analysis.json`);
    
  } catch (error) {
    console.error(`❌ Errore critico:`, error.message);
    process.exit(1);
  }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  analyzeChainAPY,
  analyzeAllChainsAPY,
  generateComparisonReport,
  saveResultsToFile
};
