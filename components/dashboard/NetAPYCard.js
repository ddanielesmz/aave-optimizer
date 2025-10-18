"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { formatUnits } from "viem";
import InfoButton from "@/components/InfoButton";

// Hook per gestire il mounting e evitare hydration mismatch
function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return isClient;
}

// Helper functions per i calcoli
function computeWeightedAPY(supplies, borrows) {
  if (!supplies || !borrows) return 0;
  
  // Calcola weighted average per supply
  const totalSupplyValue = supplies.reduce((sum, s) => sum + (s.valueUSD || 0), 0);
  const supplyWeighted = totalSupplyValue > 0 
    ? supplies.reduce((sum, s) => sum + ((s.valueUSD || 0) * (s.apy || 0)), 0) / totalSupplyValue
    : 0;
  
  // Calcola weighted average per borrow
  const totalBorrowValue = borrows.reduce((sum, b) => sum + (b.valueUSD || 0), 0);
  const borrowWeighted = totalBorrowValue > 0
    ? borrows.reduce((sum, b) => sum + ((b.valueUSD || 0) * (b.apy || 0)), 0) / totalBorrowValue
    : 0;
  
  return { supplyWeighted, borrowWeighted, totalSupplyValue, totalBorrowValue };
}

function calculateNetAPY(supplies, borrows, netWorth) {
  if (netWorth === 0) return 0;
  
  const { supplyWeighted, borrowWeighted, totalSupplyValue, totalBorrowValue } = computeWeightedAPY(supplies, borrows);
  
  // Net APY = (Supply APY * Supply Value - Borrow APY * Borrow Value) / Net Worth
  const netAPY = ((supplyWeighted * totalSupplyValue) - (borrowWeighted * totalBorrowValue)) / netWorth;
  
  return netAPY; // Ritorna in percentuale (es. -0.5 significa -0.5%)
}


// Formattazione USD con Intl.NumberFormat
function formatUSD(value) {
  if (value === 0) return "$0.00";
  if (isNaN(value) || !isFinite(value)) return "$0.00";
  
  const absValue = Math.abs(value);
  
  if (absValue < 0.01) {
    return "< $0.01";
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Formattazione percentuale
function formatPercentage(value) {
  if (isNaN(value) || !isFinite(value)) return "0.00";
  return value.toFixed(2);
}

export default function NetAPYCard({ 
  data = { 
    netWorth: 0, 
    supplies: [], 
    borrows: [] 
  },
  onRefresh = null 
}) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isClient = useIsClient();
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Stati per Health Factor
  const [aaveData, setAaveData] = useState(null);
  const [isLoadingHF, setIsLoadingHF] = useState(false);
  const [errorHF, setErrorHF] = useState(null);
  const [lastUpdatedHF, setLastUpdatedHF] = useState(null);

  // Dati fittizi di fallback per Health Factor
  const fallbackHFData = {
    healthFactor: 1.57,
    totalCollateral: 1234.56,
    totalDebt: 567.89,
    availableBorrows: 666.67
  };

  // Calcola Net APY dai dati forniti
  const netAPY = calculateNetAPY(data.supplies, data.borrows, data.netWorth);
  
  // Determina il testo e il colore
  const isPositive = netAPY > 0;
  const isNegative = netAPY < 0;
  const hasData = data.netWorth !== 0 && (data.supplies?.length > 0 || data.borrows?.length > 0);
  
  // Funzione per fetchare i dati Aave per Health Factor
  const fetchAaveData = async () => {
    if (!address) return;
    
    setIsLoadingHF(true);
    setErrorHF(null);
    
    try {
      const url = chainId 
        ? `/api/aave/onchain?address=${address}&chainId=${chainId}`
        : `/api/aave/onchain?address=${address}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.data) {
        setAaveData(result.data);
        setLastUpdatedHF(new Date());
      } else {
        if (result.error === "Errore nel recupero dei dati") {
          throw new Error('Aave configuration missing. Please check environment variables.');
        } else if (result.error === "Indirizzo non valido") {
          throw new Error('Invalid wallet address');
        } else if (result.error === "Rete non supportata") {
          throw new Error(`Network not supported. Please switch to Ethereum, Polygon, Optimism, Arbitrum, or Avalanche.`);
        } else {
          throw new Error(result.message || 'Error fetching Aave data');
        }
      }
    } catch (err) {
      console.error('Errore fetch Aave:', err);
      setErrorHF(err.message);
      setAaveData(null);
    } finally {
      setIsLoadingHF(false);
    }
  };

  // Gestisci il mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-fetch Health Factor quando l'utente si connette
  useEffect(() => {
    if (isClient && isConnected && address) {
      fetchAaveData();
    }
  }, [isClient, isConnected, address, chainId]);

  // Funzione per aggiornare i dati
  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        await fetchAaveData(); // Aggiorna anche Health Factor
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Logica Health Factor
  const displayHFData = aaveData || fallbackHFData;
  const isRealHFData = !!aaveData;
  const rawHealthFactor = displayHFData.healthFactor;
  const borrowBalance = displayHFData.totalDebt || 0;

  let healthFactorDisplay;
  let healthFactorLabel;

  if (isLoadingHF) {
    healthFactorDisplay = <span className="loading loading-spinner loading-xs"></span>;
    healthFactorLabel = "Health Factor";
  } else if (!rawHealthFactor || borrowBalance === 0 || (typeof rawHealthFactor === 'number' && rawHealthFactor > 1e50)) {
    healthFactorDisplay = "∞";
    healthFactorLabel = "No Active Debt";
  } else {
    const hfValue = typeof rawHealthFactor === 'string' 
      ? Number(formatUnits(BigInt(rawHealthFactor), 18))
      : rawHealthFactor;
    healthFactorDisplay = hfValue.toFixed(2);
    healthFactorLabel = "Health Factor";
  }

  const healthFactor = (!rawHealthFactor || borrowBalance === 0 || (typeof rawHealthFactor === 'number' && rawHealthFactor > 1e50)) 
    ? 3.0
    : (typeof rawHealthFactor === 'string' 
      ? Number(formatUnits(BigInt(rawHealthFactor), 18))
      : rawHealthFactor);

  const getHealthFactorColor = (hf) => {
    if (hf >= 2) return 'success';
    if (hf >= 1.5) return 'warning';
    return 'error';
  };

  const healthFactorColor = getHealthFactorColor(healthFactor);
  const iconColor = isRealHFData ? healthFactorColor : 'warning';

  // Non renderizzare nulla se non è montato o non è client
  if (!mounted || !isClient) {
    return (
      <div className="bg-base-100 rounded-lg border border-base-200 p-4 mb-4">
        <div className="flex items-center gap-8">
          {/* Sezione sinistra */}
          <div className="flex items-center gap-8 flex-1">
            <div className="text-center flex-1">
              <div className="text-xs text-base-content/70 mb-1">Net Worth</div>
              <div className="text-xl font-bold text-base-content/50">--</div>
            </div>
            <div className="w-px h-12 bg-base-300"></div>
            <div className="text-center flex-1">
              <div className="text-xs text-base-content/70 mb-1">Net APY</div>
              <div className="text-xl font-bold text-base-content/50">--</div>
            </div>
          </div>
          
          {/* Linea centrale */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-px h-20 bg-base-300"></div>
            <div className="w-2 h-2 bg-base-300 rounded-full -my-1"></div>
            <div className="w-px h-20 bg-base-300"></div>
          </div>
          
          {/* Sezione destra */}
          <div className="text-center min-w-[180px]">
            <div className="text-xs text-base-content/70 mb-1">Health Factor</div>
            <div className="text-xl font-bold text-base-content/50 mb-2">--</div>
            <div className="w-full">
              <progress className="progress w-full h-2 rounded-full progress-warning" value="50" max="100"></progress>
              <div className="flex justify-between text-xs text-base-content/50 mt-1">
                <span>Risk</span>
                <span>Safe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 rounded-2xl border border-base-300 p-5 mb-4 shadow-md hover:shadow-lg hover:-translate-y-[1px] transition-all duration-300">
      {/* Header compatto */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base-content font-semibold tracking-tight">Portfolio Overview</h2>
          <InfoButton 
            title="Portfolio Overview"
            content={`
              <div class='grid grid-cols-2 gap-2 text-xs'>
                <div class='p-2 rounded-lg bg-base-200 border border-base-300'>
                  <div class='font-semibold'>Net Worth</div>
                  <div class='text-base-content/70'>Collateral − Debt</div>
                </div>
                <div class='p-2 rounded-lg bg-base-200 border border-base-300'>
                  <div class='font-semibold'>Net APY</div>
                  <div class='text-base-content/70'>Media pesata supply/borrow</div>
                </div>
                <div class='p-2 rounded-lg bg-base-200 border border-base-300'>
                  <div class='font-semibold'>HF</div>
                  <div class='text-base-content/70'>Sicurezza posizione</div>
                </div>
                <div class='p-2 rounded-lg bg-info/10 border border-info/20'>
                  <div class='font-semibold text-info'>Tip</div>
                  <div class='text-base-content/70'>Mantieni HF ≥ 1.5</div>
                </div>
              </div>
            `}
            size="xs"
          />
        </div>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-ghost btn-xs hover:bg-base-200"
            title="Aggiorna dati"
          >
            {isRefreshing ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Layout principale: Net Worth/APY a sinistra, Health Factor a destra */}
      <div className="flex items-center gap-8">
        {/* Sezione sinistra: Net Worth e Net APY */}
        <div className="flex items-center gap-8 flex-1">
          {/* Net Worth */}
          <div className="text-center flex-1">
            <div className="text-xs text-base-content/70 mb-1">Net Worth</div>
            {!isConnected ? (
              <div className="text-xl font-bold text-base-content/50">--</div>
            ) : !hasData ? (
              <div className="text-xl font-bold text-base-content/50">N/D</div>
            ) : (
              <div className={`text-2xl font-extrabold tabular-nums ${data.netWorth >= 0 ? 'text-success' : 'text-error'}`}>
                {formatUSD(data.netWorth)}
              </div>
            )}
          </div>

          {/* Separatore verticale tra Net Worth e Net APY */}
          <div className="w-px h-12 bg-base-300"></div>

          {/* Net APY */}
          <div className="text-center flex-1">
            <div className="text-xs text-base-content/70 mb-1">Net APY</div>
            {!isConnected ? (
              <div className="text-xl font-bold text-base-content/50">--</div>
            ) : !hasData ? (
              <div className="text-xl font-bold text-base-content/50">N/D</div>
            ) : (
              <>
                <div className={`text-2xl font-extrabold tabular-nums ${
                  isPositive ? 'text-success' : 
                  isNegative ? 'text-error' : 
                  'text-base-content'
                }`}>
                  {isPositive ? '+' : ''}{formatPercentage(netAPY)}%
                </div>
                {/* Stima interessi annuali */}
                <div className="text-xs text-base-content/60 mt-1">
                  {isPositive ? 'Earn' : 'Pay'} {formatUSD(Math.abs(netAPY * data.netWorth / 100))}/year
                </div>
              </>
            )}
          </div>
        </div>

        {/* Linea centrale principale che divide le due sezioni */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-px h-20 bg-base-300"></div>
          <div className="w-2 h-2 bg-base-300 rounded-full -my-1"></div>
          <div className="w-px h-20 bg-base-300"></div>
        </div>

        {/* Sezione destra: Health Factor */}
        <div className="text-center min-w-[180px]">
          <div className="text-xs text-base-content/70 mb-1">{healthFactorLabel}</div>
          <div className={`text-xl font-bold mb-2 ${
            iconColor === 'success' ? 'text-success' : 
            iconColor === 'warning' ? 'text-warning' : 
            'text-error'
          }`}>
            {healthFactorDisplay}
          </div>
          {/* Barra progress compatta */}
          <div className="w-full">
            <progress 
              className={`progress w-full h-2 rounded-full ${
                healthFactorColor === 'error' ? 'progress-error' : 
                healthFactorColor === 'warning' ? 'progress-warning' : 
                'progress-success'
              }`}
              value={Math.min(100, Math.max(0, (healthFactor - 0.5) / 2 * 100))}
              max="100"
            ></progress>
            {/* Indicatori di rischio */}
            <div className="flex justify-between text-xs text-base-content/50 mt-1">
              <span>Risk</span>
              <span>Safe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
