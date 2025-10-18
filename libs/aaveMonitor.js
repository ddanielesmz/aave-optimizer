// Import selettivi per ridurre il bundle size
import { JsonRpcProvider, Contract } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Configura il provider Ethereum
const provider = new JsonRpcProvider(
  process.env.ETHEREUM_RPC_URL || "https://cloudflare-eth.com",
  {
    name: "mainnet",
    chainId: 1
  }
);

// Indirizzi dei contratti Aave V3 su Ethereum Mainnet
const LENDING_POOL_ADDRESS_PROVIDER = '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e';
const PROTOCOL_DATA_PROVIDER = '0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d';

// ABI semplificato per AaveProtocolDataProvider
const PROTOCOL_DATA_PROVIDER_ABI = [
  "function getAllReservesTokens() external view returns (tuple(address aToken, address stableDebtToken, address variableDebtToken, uint8 decimals, string symbol, string name)[] memory)",
  "function getReserveData(address asset) external view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt) memory)",
  "function getReserveConfigurationData(address asset) external view returns (tuple(uint256 data) memory)"
];

// Crea l'istanza del contratto
const protocolDataProvider = new Contract(
  PROTOCOL_DATA_PROVIDER,
  PROTOCOL_DATA_PROVIDER_ABI,
  provider
);

// Funzione per leggere i dati dei mercati Aave
async function getAaveReserves() {
  try {
    const reserves = await protocolDataProvider.getAllReservesTokens();
    console.log("Reserves:", reserves);
    return reserves;
  } catch (error) {
    console.error("Errore fetching Aave reserves:", error);
  }
}

// Funzione per ottenere i dati di un token specifico
async function getReserveData(tokenAddress) {
  try {
    const reserveData = await protocolDataProvider.getReserveData(tokenAddress);
    console.log("Reserve Data:", reserveData);
    return reserveData;
  } catch (error) {
    console.error("Errore fetching reserve data:", error);
  }
}

// Funzione per ottenere i dati di tutti i mercati (alias per getAaveReserves)
async function getAllMarketsData() {
  return await getAaveReserves();
}

// Funzione per ottenere i dati di configurazione di un token
async function getConfigurationData(tokenAddress) {
  try {
    const config = await protocolDataProvider.getReserveConfigurationData(tokenAddress);
    console.log("Configuration:", config);
    return config;
  } catch (error) {
    console.error("Errore fetching configuration:", error);
  }
}

// Funzione per ottenere informazioni di base del protocollo
async function getProtocolInfo() {
  try {
    const reserves = await getAaveReserves();
    if (!reserves) {
      return {
        totalReserves: 0,
        reserves: [],
        error: "Impossibile ottenere i dati delle riserve"
      };
    }
    return {
      totalReserves: reserves.length,
      reserves: reserves.map(reserve => ({
        symbol: reserve.symbol,
        name: reserve.name,
        decimals: reserve.decimals,
        aToken: reserve.aToken,
        stableDebtToken: reserve.stableDebtToken,
        variableDebtToken: reserve.variableDebtToken
      }))
    };
  } catch (error) {
    console.error("Errore fetching protocol info:", error);
    return {
      totalReserves: 0,
      reserves: [],
      error: error.message
    };
  }
}

// Funzione principale per monitorare Aave
async function monitorAave() {
  console.log("🚀 Avvio monitoraggio Aave...");
  
  try {
    // Ottieni tutti i dati
    const reserves = await getAaveReserves();
    const protocolInfo = await getProtocolInfo();
    
    console.log("✅ Monitoraggio completato con successo!");
    
    return {
      reserves,
      protocolInfo,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("❌ Errore durante il monitoraggio:", error);
    throw error;
  }
}

// Esegui il monitoraggio se il file viene eseguito direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  getAaveReserves();
}

export {
  getAaveReserves,
  getReserveData,
  getAllMarketsData,
  getConfigurationData,
  getProtocolInfo,
  monitorAave,
  protocolDataProvider
};
