"use client";

import React, { memo, useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useAaveSupplyOptimization } from '@/libs/useAaveData';
import { fetchUserNonStablecoinSupplyPositions } from '@/libs/aaveAllCollateralsUtils';
import { WidgetErrorBoundary } from '@/components/ErrorBoundaryOptimized';
import CoinLogo from '@/components/CoinLogo';
import InfoButton from '@/components/InfoButton';

const StablecoinSupplyOptimizer = memo(() => {
  const { chainId, address } = useAccount();
  const { 
    positions, 
    recommendations, 
    isLoading, 
    error, 
    lastUpdated, 
    refetch,
    forceRefresh 
  } = useAaveSupplyOptimization();

  // Stati per altri collaterali
  const [otherCollaterals, setOtherCollaterals] = useState([]);
  const [isLoadingOthers, setIsLoadingOthers] = useState(false);
  const [showOthers, setShowOthers] = useState(false);

  // Utility functions
  const formatAmount = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(2);
  };

  const formatAPY = (apy) => {
    return `${(apy * 100).toFixed(2)}%`;
  };

  const getNetworkName = (chainId) => {
    if (!chainId) return 'Unknown Network';
    const networks = {
      1: 'Ethereum',
      137: 'Polygon',
      10: 'Optimism',
      42161: 'Arbitrum',
      43114: 'Avalanche'
    };
    return networks[chainId] || 'Unknown Network';
  };

  const hasRecommendations = recommendations.some(rec => rec.bestAlternative);

  // Carica posizioni di supply non-stablecoin dell'utente
  const loadOtherCollaterals = useCallback(async () => {
    if (!chainId || !address) return;
    
    setIsLoadingOthers(true);
    try {
      const userSupplyPositions = await fetchUserNonStablecoinSupplyPositions(address, chainId);
      setOtherCollaterals(userSupplyPositions);
    } catch (error) {
      console.error('Error loading user non-stablecoin supply positions:', error);
    } finally {
      setIsLoadingOthers(false);
    }
  }, [chainId, address]);

  // Carica posizioni quando la chain o l'indirizzo cambia
  useEffect(() => {
    loadOtherCollaterals();
  }, [chainId, address, loadOtherCollaterals]);

  return (
    <WidgetErrorBoundary fallbackMessage="Unable to load supply optimization data">
      <div className="card bg-base-100 rounded-2xl border border-base-300 p-5 shadow-md hover:shadow-lg hover:-translate-y-[1px] transition-all duration-300 min-h-[180px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base-content font-semibold tracking-tight">Stablecoin Supply Optimizer</h3>
            <InfoButton 
              title="Stablecoin Supply Optimizer"
              content={`
                <div class='grid grid-cols-2 gap-2 text-xs'>
                  <div class='p-2 rounded-lg bg-base-200 border border-base-300'>
                    <div class='font-semibold'>Goal</div>
                    <div class='text-base-content/70'>Maximize APY on deposits</div>
                  </div>
                  <div class='p-2 rounded-lg bg-base-200 border border-base-300'>
                    <div class='font-semibold'>How</div>
                    <div class='text-base-content/70'>Compare APY across stablecoins</div>
                  </div>
                  <div class='p-2 rounded-lg bg-success/10 border border-success/20'>
                    <div class='font-semibold text-success'>Optimal</div>
                    <div class='text-base-content/70'>Your choice is already optimal</div>
                  </div>
                  <div class='p-2 rounded-lg bg-warning/10 border border-warning/20'>
                    <div class='font-semibold text-warning'>Consider switching</div>
                    <div class='text-base-content/70'>We suggest the token and better APY</div>
                  </div>
                </div>
              `}
              size="xs"
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
              title="Refresh Optimization Data"
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

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="loading loading-spinner loading-md"></div>
              <div className="text-sm text-base-content/60">Loading supply positions...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-4">
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
          ) : positions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="text-base-content/60 text-center">
                <div className="text-sm">No stablecoin supply positions found</div>
                <div className="text-xs text-base-content/50 mt-1">
                  Start supplying stablecoins to get optimization recommendations
                </div>
              </div>
            </div>
          ) : !hasRecommendations ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="text-success text-center">
                <div className="text-sm font-medium">All your stablecoin supply positions are optimal</div>
                <div className="text-xs text-base-content/60 mt-1">
                  No better APY alternatives found
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 w-full">
              {recommendations.map((rec, index) => (
                <div key={index} className="border border-base-300 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CoinLogo symbol={rec.symbol} size={24} />
                      <span className="font-medium text-base-content">
                        {rec.symbol}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-base-content">
                        {formatAmount(rec.currentBalance)} {rec.symbol}
                      </div>
                      <div className="text-xs text-base-content/60">
                        {formatAPY(rec.currentAPY)}
                      </div>
                    </div>
                  </div>
                  {rec.bestAlternative ? (
                    <div className="bg-warning/10 border border-warning/20 rounded p-2">
                      <div className="flex items-center gap-2 text-warning">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium">Consider switching</span>
                      </div>
                      <div className="text-xs text-base-content/80 mt-1">
                        Switch to <span className="font-medium text-warning">{rec.bestAlternative.symbol}</span> at 
                        <span className="font-medium text-warning"> {formatAPY(rec.bestAlternative.apy)}</span>
                        {' '}(+{formatAPY(rec.bestAlternative.improvement)})
                      </div>
                    </div>
                  ) : (
                    <div className="bg-success/10 border border-success/20 rounded p-2">
                      <div className="flex items-center gap-2 text-success">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium">Position is optimal</span>
                      </div>
                      <div className="text-xs text-base-content/80 mt-1">
                        Your {rec.symbol} supply APY is already the best available
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other Collaterals Toggle */}
        {!isLoading && !error && (
          <div className="mt-3">
            <div className="mt-3">
              <button
                onClick={() => setShowOthers(!showOthers)}
                aria-expanded={showOthers}
                className="w-full flex items-center justify-between px-3 py-2 bg-base-200 hover:bg-base-300 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-base-content">Other Collateral Coins</span>
                  <span className="badge badge-sm badge-neutral">{otherCollaterals.length}</span>
                </div>
                <svg 
                  className={`w-4 h-4 transition-transform ${showOthers ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showOthers && (
                <div className="mt-2 rounded-xl border border-base-300 bg-base-100 max-h-56 overflow-y-auto">
                  {isLoadingOthers ? (
                    <div className="flex items-center justify-center py-3 text-xs text-base-content/60">
                      <span className="loading loading-spinner loading-xs"></span>
                      <span className="ml-2">Loading other collaterals...</span>
                    </div>
                  ) : otherCollaterals.length > 0 ? (
                    <div className="divide-y divide-base-300">
                      {otherCollaterals.map((position, index) => (
                        <div key={index} className="flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-3">
                            <CoinLogo symbol={position.symbol} size={20} />
                            <div>
                              <div className="text-sm font-medium text-base-content">{position.symbol}</div>
                              <div className="text-xs text-base-content/60">Supply: {formatAmount(position.supplyAmount)} • {position.formattedUSDValue || '$0.00'}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="badge badge-ghost badge-sm">{formatAPY(position.supplyAPY)}</div>
                            <div className="text-[10px] text-base-content/60 mt-1">Supply APY</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-center text-base-content/60">
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2h-6M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2" />
                        </svg>
                        <span>No non-stablecoin collateral positions</span>
                      </div>
                      <div className="text-[10px] mt-1">Only stablecoin positions are shown above</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </WidgetErrorBoundary>
  );
});

StablecoinSupplyOptimizer.displayName = 'StablecoinSupplyOptimizer';

export default StablecoinSupplyOptimizer;
