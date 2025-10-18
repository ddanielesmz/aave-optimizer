"use client";

import React, { memo } from 'react';
import { useAaveUserData } from '@/libs/useAaveData';
import { WidgetErrorBoundary } from '@/components/ErrorBoundaryOptimized';
import InfoButton from '@/components/InfoButton';

const FinancialSummaryWidget = memo(() => {
  const { 
    userAccountData, 
    supplyPositions, 
    borrowPositions, 
    isLoading, 
    error, 
    lastUpdated, 
    refetch,
    forceRefresh 
  } = useAaveUserData();

  const getNetworkName = (chainId) => {
    if (!chainId) return 'Unknown Network';
    switch (chainId) {
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      case 10: return 'Optimism';
      case 42161: return 'Arbitrum';
      case 43114: return 'Avalanche';
      default: return 'Unknown Network';
    }
  };

  const calculateNetAPY = (supplyPositions, borrowPositions) => {
    if (supplyPositions.length === 0 && borrowPositions.length === 0) {
      return 0;
    }

    let totalSupplyValue = 0;
    let totalBorrowValue = 0;
    let weightedSupplyAPY = 0;
    let weightedBorrowAPY = 0;

    // Calcola APY ponderato per supply
    supplyPositions.forEach(position => {
      const supplyValue = position.currentBalance;
      totalSupplyValue += supplyValue;
      weightedSupplyAPY += supplyValue * position.currentAPY;
    });

    // Calcola APY ponderato per borrow
    borrowPositions.forEach(position => {
      const borrowValue = position.currentDebt;
      totalBorrowValue += borrowValue;
      weightedBorrowAPY += borrowValue * position.currentBorrowRate;
    });

    // Calcola Net APY: (Supply APY * Supply Value - Borrow APY * Borrow Value) / Total Value
    const totalValue = totalSupplyValue + totalBorrowValue;
    if (totalValue === 0) return 0;

    const netAPY = (weightedSupplyAPY - weightedBorrowAPY) / totalValue;
    return netAPY;
  };

  const calculateAnnualInterestEstimate = (netAPY, totalSupplyValue, totalBorrowValue) => {
    const totalValue = totalSupplyValue + totalBorrowValue;
    return totalValue * netAPY;
  };

  // Calcola i valori derivati dai dati
  const netWorth = userAccountData ? userAccountData.totalCollateral - userAccountData.totalDebt : 0;
  const netAPY = calculateNetAPY(supplyPositions, borrowPositions);
  const annualInterestEstimate = userAccountData ? 
    calculateAnnualInterestEstimate(netAPY, userAccountData.totalCollateral, userAccountData.totalDebt) : 0;

  const formatCurrency = (value) => {
    if (value === 0) return '$0.00';
    if (Math.abs(value) < 0.01) return `$${value.toFixed(4)}`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value) => {
    if (value === 0) return '0.00%';
    return `${(value * 100).toFixed(2)}%`;
  };

  const getValueColor = (value) => {
    if (value < 0) return 'text-error';
    if (value === 0) return 'text-base-content';
    return 'text-success';
  };

  return (
    <WidgetErrorBoundary fallbackMessage="Unable to load financial summary data">
      <div className="card bg-base-100 rounded-2xl border border-base-300 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-[1px] p-3 flex flex-col justify-between min-h-[110px] relative">
        {/* Header with title, info button, updated time and refresh button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base-content font-semibold tracking-tight">Financial Summary</h3>
            <InfoButton 
              title="Financial Summary"
              content={`
                <div class='grid grid-cols-2 gap-2 text-xs'>
                  <div class='p-2 rounded-lg bg-base-200 border border-base-300'>
                    <div class='font-semibold'>Net Worth</div>
                    <div class='text-base-content/70'>Supply − Borrow</div>
                  </div>
                  <div class='p-2 rounded-lg bg-base-200 border border-base-300'>
                    <div class='font-semibold'>Net APY</div>
                    <div class='text-base-content/70'>(Supply APY − Borrow APY) pesato</div>
                  </div>
                  <div class='p-2 rounded-lg bg-base-200 border border-base-300'>
                    <div class='font-semibold'>Collateral</div>
                    <div class='text-base-content/70'>Valore depositi</div>
                  </div>
                  <div class='p-2 rounded-lg bg-base-200 border border-base-300'>
                    <div class='font-semibold'>Debt</div>
                    <div class='text-base-content/70'>Valore prestiti</div>
                  </div>
                </div>
                <div class='mt-2 text-[11px] text-base-content/60'>Tip: LTV basso e HF ≥ 1.5 = posizione più sicura.</div>
              `}
            />
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-base-content/60 tabular-nums">
                Updated {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(lastUpdated)}
              </span>
            )}
            <button 
            onClick={forceRefresh}
            disabled={isLoading}
            className="btn btn-ghost btn-sm btn-circle hover:bg-base-200 transition-colors duration-200"
            title="Refresh Financial Data"
          >
            <svg 
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center">
          {isLoading ? (
            <div className="py-4 flex items-center justify-center">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4">
              <div className="text-error text-sm text-center">
                {error}
              </div>
              <button 
                onClick={refetch}
                className="btn btn-sm btn-outline"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 w-full bg-base-100 rounded-xl border border-base-300 shadow-sm md:divide-x md:divide-base-300">
              {/* Net Worth (centered within left half) */}
              <div className="flex flex-col items-center justify-center text-center p-2">
                <div className="text-base-content/70 text-[11px] md:text-xs">Net Worth</div>
                <div className={`text-xl md:text-2xl font-extrabold tabular-nums ${getValueColor(netWorth)} mt-0.5`}>
                  {formatCurrency(netWorth)}
                </div>
                <div className="hidden md:block text-base-content/60 text-xs mt-0.5">
                  Supply: {formatCurrency(userAccountData?.totalCollateral || 0)} • Borrow: {formatCurrency(userAccountData?.totalDebt || 0)}
                </div>
              </div>

              {/* Net APY (centered within right half) */}
              <div className="flex flex-col items-center justify-center text-center p-2">
                <div className="text-base-content/70 text-[11px] md:text-xs">Net APY</div>
                <div className={`text-xl md:text-2xl font-extrabold tabular-nums ${getValueColor(netAPY)} mt-0.5`}>
                  {formatPercentage(netAPY)}
                </div>
                <div className="hidden md:block text-base-content/60 text-xs mt-0.5">
                  Annual interest: {formatCurrency(annualInterestEstimate)}
                </div>
              </div>
            </div>
          )}
        </div>
      
      </div>
    </WidgetErrorBoundary>
  );
});

FinancialSummaryWidget.displayName = 'FinancialSummaryWidget';

export default FinancialSummaryWidget;
