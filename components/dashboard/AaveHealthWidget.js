"use client";

import React, { memo } from 'react';
import { useAccount } from 'wagmi';
import { useAaveHealthFactor } from '@/libs/useAaveData';
import { WidgetErrorBoundary } from '@/components/ErrorBoundaryOptimized';
import InfoButton from '@/components/InfoButton';
import AlertSettings from '@/components/AlertSettings';
import TestAlertIcon from '@/components/TestAlertIcon';

const AaveHealthWidget = memo(() => {
  const { chainId } = useAccount();
  const { 
    healthFactor, 
    isLoading, 
    error, 
    lastUpdated, 
    refetch,
    forceRefresh 
  } = useAaveHealthFactor();

  // Removed network name display per design optimization

  // Utility functions

  const getHealthFactorColor = (hf) => {
    if (hf === Infinity) return 'text-success';
    if (hf >= 2.0) return 'text-success'; // Safe
    if (hf >= 1.5) return 'text-yellow-500'; // Caution (yellow)
    if (hf >= 1.1) return 'text-orange-500'; // Risk (orange)
    return 'text-error'; // Liquidation (red)
  };

  const getHealthFactorStatus = (hf) => {
    if (hf === Infinity) return 'No Open Positions';
    if (hf >= 2.0) return 'Safe';
    if (hf >= 1.5) return 'Caution';
    if (hf >= 1.1) return 'Risk';
    return 'Liquidation';
  };

  const getHealthFactorBarData = (hf) => {
    let barColor = 'bg-error';
    let fillPercentage = 0;

    if (hf === Infinity) {
      barColor = 'bg-success';
      fillPercentage = 100;
    } else if (hf < 1.0) {
      barColor = 'bg-error'; // Liquidation
      fillPercentage = Math.max(10, (hf / 1.0) * 25);
    } else if (hf < 1.5) {
      barColor = 'bg-orange-500'; // Risk (orange)
      fillPercentage = 25 + ((hf - 1.0) / 0.5) * 20; // 25% -> 45%
    } else if (hf < 2.0) {
      barColor = 'bg-yellow-500'; // Caution (yellow)
      fillPercentage = 45 + ((hf - 1.5) / 0.5) * 20; // 45% -> 65%
    } else if (hf <= 3.0) {
      barColor = 'bg-success'; // Safe
      fillPercentage = 65 + ((hf - 2.0) / 1.0) * 35; // 65% -> 100%
    } else {
      barColor = 'bg-success';
      fillPercentage = 100;
    }

    return {
      fillPercentage: Math.min(100, Math.max(0, fillPercentage)),
      barColor
    };
  };

  return (
    <WidgetErrorBoundary fallbackMessage="Unable to load health factor data">
      <div className="card bg-base-100 rounded-2xl border border-base-300 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-[1px] p-6 flex flex-col justify-between min-h-[200px] relative">
        {/* Header with title, info button, updated time and refresh button */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h3 className="text-base-content font-semibold tracking-tight">Health Factor</h3>
            <InfoButton 
              title="Health Factor"
              content={`
                <div class='space-y-3'>
                  <div class='alert alert-info py-2 px-3 rounded-lg text-sm'>
                    <span><strong>HF</strong> = collateral / debt. Più è alto, più sei lontano dalla liquidazione.</span>
                  </div>
                  <div class='grid grid-cols-2 gap-2 text-xs'>
                    <div class='p-2 rounded-lg bg-success/10 border border-success/20'>
                    <div class='font-semibold text-success'>Safe ≥ 2.0</div>
                      <div class='text-base-content/70'>Large safety margin</div>
                    </div>
                    <div class='p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20'>
                      <div class='font-semibold text-yellow-500'>Caution 1.5–1.99</div>
                      <div class='text-base-content/70'>Monitor price moves</div>
                    </div>
                    <div class='p-2 rounded-lg bg-orange-500/10 border border-orange-500/20'>
                      <div class='font-semibold text-orange-500'>Risk 1.1–1.49</div>
                      <div class='text-base-content/70'>Add collateral or reduce debt</div>
                    </div>
                    <div class='p-2 rounded-lg bg-error/10 border border-error/20'>
                      <div class='font-semibold text-error'>Liquidation &lt; 1.0</div>
                      <div class='text-base-content/70'>Liquidable (below ~0.95 up to 100%)</div>
                    </div>
                  </div>
                </div>
              `}
            />
            <TestAlertIcon />
            <AlertSettings
              widgetType="healthFactor"
              currentValue={healthFactor}
              widgetName="Health Factor"
            />
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-base-content/60 tabular-nums">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button 
              onClick={forceRefresh}
              disabled={isLoading}
              className="btn btn-ghost btn-sm btn-circle hover:bg-base-200 transition-colors duration-200"
              title="Refresh Health Data"
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
        
        {/* Main content - aligned to LTV layout */}
        <div className="flex-1 flex flex-col items-center gap-4 w-full">
          {error ? (
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
            <>
              {/* Health Factor Value with tooltip */}
              <div className={`text-4xl font-extrabold leading-none ${getHealthFactorColor(healthFactor)}`}>
                <span
                  className="tooltip"
                  data-tip={healthFactor === Infinity ? 'No debt or collateral positions' : 'Health factor: higher is safer'}
                >
                  {isLoading
                    ? <span className="loading loading-spinner loading-sm"></span>
                    : (healthFactor === Infinity ? '∞' : healthFactor.toFixed(2))}
                </span>
              </div>
              
              {/* Status as badge */}
              <div>
                {(() => {
                  const status = getHealthFactorStatus(healthFactor);
                  if (status === 'Safe') {
                    return <span className="badge badge-sm badge-success badge-outline">Safe</span>;
                  }
                  if (status === 'Caution') {
                    return <span className="badge badge-sm badge-outline text-yellow-600 border-yellow-500/60">Caution</span>;
                  }
                  if (status === 'Risk') {
                    return <span className="badge badge-sm badge-outline text-orange-600 border-orange-500/60">Risk</span>;
                  }
                  return <span className="badge badge-sm badge-error badge-outline">Liquidation</span>;
                })()}
              </div>
              
              {/* Additional info for infinite health factor */}
              {healthFactor === Infinity && (
                <div className="text-xs text-base-content/60 text-center max-w-48">
                  No loans or collateral positions on Aave
                </div>
              )}
              
              {/* Health Factor Progress Bar - Full Width */}
              <div className="w-full px-2">
                {/* Range indicators with tooltips */}
                <div className="flex justify-between text-xs text-base-content/60 mb-1">
                  <span className="tooltip" data-tip="~Liquidation boundary">
                    1.0
                  </span>
                  <span className="tooltip" data-tip="Healthy target range">
                    3.0
                  </span>
                </div>
                
                {/* Progress bar with external label wrapper to mirror LTV spacing */}
                <div className="relative pb-9">
                  <div className="w-full bg-base-200 rounded-full h-3.5 overflow-hidden">
                    <div 
                      className={`h-3.5 rounded-full transition-all duration-700 ease-out ${getHealthFactorBarData(healthFactor).barColor} bg-gradient-to-r from-transparent/0 to-base-100/10`}
                      style={{ 
                        width: `${getHealthFactorBarData(healthFactor).fillPercentage}%`,
                        minWidth: '8px'
                      }}
                    ></div>
                  </div>
                  {/* Safe/Risk labels with tooltips */}
                  <div className="flex justify-between text-xs text-base-content/60 mt-1">
                    <span className="tooltip" data-tip="HF close to 1.0 = high risk">Risk</span>
                    <span className="tooltip" data-tip="HF ≥ 2.0 = safe">Safe</span>
                  </div>
                </div>
                
              </div>
            </>
          )}
        </div>
      </div>
    </WidgetErrorBoundary>
  );
});

AaveHealthWidget.displayName = 'AaveHealthWidget';

export default AaveHealthWidget;
