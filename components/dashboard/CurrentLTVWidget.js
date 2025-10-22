"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAaveUserAccountDataRealtime } from '@/libs/useAaveData';
import { WidgetErrorBoundary } from '@/components/ErrorBoundaryOptimized';
import InfoButton from '@/components/InfoButton';
import StatusBadge from '@/components/StatusBadge';
import AlertSettings from '@/components/AlertSettings';

// Card that shows the user's current Loan-to-Value (LTV) from Aave with UI matching the screenshot
export default function CurrentLTVWidget() {
  const { userAccountData, isLoading, error, lastUpdated, refetch } = useAaveUserAccountDataRealtime(15000);
  const [isHydrated, setIsHydrated] = useState(false);

  // Ensure initial server render matches the initial client render to avoid hydration mismatches
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Normalize values from Aave: ltv and liquidation threshold are returned as basis points
  const { ltvPercent, liqThresholdPercent } = useMemo(() => {
    if (!userAccountData) return { ltvPercent: null, liqThresholdPercent: null };
    const totalCollateral = Number(userAccountData.totalCollateral || 0);
    const totalDebt = Number(userAccountData.totalDebt || 0);
    const rawThreshold = Number(userAccountData.currentLiquidationThreshold || 0);
    const calculatedCurrentLtv = totalCollateral > 0 ? (totalDebt / totalCollateral) * 100 : 0;
    return {
      // Current LTV must be computed from totals to match Aave UI
      ltvPercent: Math.max(0, Math.min(100, calculatedCurrentLtv)),
      liqThresholdPercent: rawThreshold / 100
    };
  }, [userAccountData]);

  // Calculate LTV status based on the computed values
  const ltvStatus = useMemo(() => {
    if (ltvPercent == null) return { label: '—', color: 'text-base-content', bar: 'bg-primary' };

    // If liquidation threshold is available, compute status relative to it
    if (liqThresholdPercent != null && liqThresholdPercent > 0) {
      const ratioToThreshold = ltvPercent / liqThresholdPercent; // how close we are to liquidation
      if (ratioToThreshold >= 1) return { label: 'Liquidation', color: 'text-error', bar: 'bg-error' };
      if (ratioToThreshold < 0.6) return { label: 'Safe', color: 'text-success', bar: 'bg-success' };
      if (ratioToThreshold < 0.8) return { label: 'Caution', color: 'text-warning', bar: 'bg-warning' };
      if (ratioToThreshold < 0.95) return { label: 'Risk', color: 'text-warning', bar: 'bg-warning' };
      return { label: 'High Risk', color: 'text-error', bar: 'bg-error' };
    }

    // Fallback to absolute bands if threshold is missing
    if (ltvPercent <= 50) return { label: 'Safe', color: 'text-success', bar: 'bg-success' };
    if (ltvPercent < 70) return { label: 'Caution', color: 'text-warning', bar: 'bg-warning' };
    if (ltvPercent < 85) return { label: 'Risk', color: 'text-warning', bar: 'bg-warning' };
    return { label: 'Liquidation', color: 'text-error', bar: 'bg-error' };
  }, [ltvPercent, liqThresholdPercent]);

  const ltvValueDisplay = isLoading
    ? (<span className="loading loading-spinner loading-sm"></span>)
    : (ltvPercent == null ? '—' : `${ltvPercent.toFixed(1)}%`);

  return (
    <WidgetErrorBoundary fallbackMessage="Unable to load LTV data">
		  <div className="card bg-base-100 rounded-2xl border border-base-300 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-[1px] p-6 flex flex-col justify-between min-h-[200px] relative">
        {/* Header with title, info button, updated time and refresh button */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h3 className="text-base-content font-semibold tracking-tight">Current LTV</h3>
            <InfoButton 
              title="Current LTV"
              content={`
                <div class='space-y-3'>
                  <div class='alert alert-info py-2 px-3 rounded-lg text-sm'>
                    <span><strong>LTV</strong> = debt / collateral. Misura quanto sei indebitato rispetto al collaterale.</span>
                  </div>
                  <div class='grid grid-cols-2 gap-2 text-xs'>
                    <div class='p-2 rounded-lg bg-success/10 border border-success/20'>
                      <div class='font-semibold text-success'>Safe ≤ ${liqThresholdPercent != null ? (0.6 * liqThresholdPercent).toFixed(2) : '50.00'}%</div>
                      <div class='text-base-content/70'>Debito basso rispetto alla tua soglia</div>
                    </div>
                    <div class='p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20'>
                      <div class='font-semibold text-yellow-500'>Caution ${liqThresholdPercent != null ? (0.6 * liqThresholdPercent).toFixed(2) : '50.00'}–${liqThresholdPercent != null ? (0.8 * liqThresholdPercent).toFixed(2) : '70.00'}%</div>
                      <div class='text-base-content/70'>Monitora in mercati volatili</div>
                    </div>
                    <div class='p-2 rounded-lg bg-orange-500/10 border border-orange-500/20'>
                      <div class='font-semibold text-orange-500'>Risk ${liqThresholdPercent != null ? (0.8 * liqThresholdPercent).toFixed(2) : '70.00'}–${liqThresholdPercent != null ? (0.95 * liqThresholdPercent).toFixed(2) : '85.00'}%</div>
                      <div class='text-base-content/70'>Vicino ai limiti sostenibili</div>
                    </div>
                    <div class='p-2 rounded-lg bg-error/10 border border-error/20'>
                      <div class='font-semibold text-error'>${liqThresholdPercent != null ? 'High Risk 95–< soglia, Liquidation ≥ soglia' : 'Liquidation ≥ Threshold'}</div>
                      <div class='text-base-content/70'>Sopra o vicino alla soglia di liquidazione</div>
                    </div>
                  </div>
                  <div class='text-xs text-base-content/70'>Linea rossa = tua <strong>Liquidation Threshold</strong> attuale${liqThresholdPercent != null ? ` (${liqThresholdPercent.toFixed(2)}%)` : ''}.</div>
                </div>
              `}
            />
            <AlertSettings
              widgetType="ltv"
              currentValue={ltvPercent ? ltvPercent / 100 : 0}
              widgetName="Current LTV"
            />
          </div>
          <div className="flex items-center gap-3">
            {isHydrated && lastUpdated && (
              <span className="text-xs text-base-content/60 tabular-nums">
                Updated {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(lastUpdated)}
              </span>
            )}
            <button 
              onClick={() => refetch?.()}
              className="btn btn-ghost btn-sm btn-circle hover:bg-base-200 transition-colors duration-200"
              title="Refresh LTV"
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
			<div className="flex-1 flex flex-col items-center gap-4 w-full">
				{/* LTV Value */}
                {(() => {
                  const colorClass = ltvStatus.color === 'text-base-content' ? 'text-base-content/80' : ltvStatus.color;
                  return (
                    <div className={`text-4xl font-extrabold leading-none ${colorClass}`}>{ltvValueDisplay}</div>
                  );
                })()}
				<div>
					<StatusBadge status={ltvStatus.label} size="sm" outline />
				</div>

          {/* Progress and labels aligned to Health widget style */}
          <div className="w-full px-2">
          {/* Range indicators with contextual tooltips */}
          <div className="flex justify-between text-xs text-base-content/60 mb-1">
            <span className="tooltip" data-tip="No debt relative to collateral (start of scale)">0%</span>
            <span className="tooltip" data-tip="Maximum on the scale">100%</span>
          </div>
          {/* Progress bar with external label wrapper to avoid clipping */}
            <div className="relative pb-9">
				  <div className="w-full bg-base-200 rounded-full h-3.5 overflow-hidden relative">
					<div 
					  className={`h-3.5 rounded-full transition-all duration-700 ease-out ${ltvStatus.bar} bg-gradient-to-r from-transparent/0 to-base-100/10`}
                  style={{ 
                    width: `${Math.max(0, Math.min(100, ltvPercent ?? 0))}%`,
                    minWidth: '8px'
                  }}
                ></div>
                {liqThresholdPercent != null && (
                  <>
                    {/* Red marker line */}
						<div
						  className="absolute -top-1.5 h-6 w-px bg-error"
                      style={{ left: `${Math.max(0, Math.min(100, liqThresholdPercent))}%` }}
                      title={`Liquidation threshold ${liqThresholdPercent.toFixed(2)}%`}
                      aria-label={`Liquidation threshold ${liqThresholdPercent.toFixed(2)} percent`}
                    />
                  </>
                )}
              </div>
              {/* Safe/Risk labels directly under the bar */}
              <div className="flex justify-between text-xs text-base-content/60 mt-1">
                <span>Safe</span>
                <span>Risk</span>
              </div>
              {liqThresholdPercent != null && (
                <div
                  className="absolute z-10 px-1.5 py-0.5 rounded-md text-[10px] bg-error/10 border border-error/30 text-error"
                  style={{ left: `${Math.max(0, Math.min(100, liqThresholdPercent))}%`, transform: 'translateX(-50%)', top: 'calc(0.875rem + 2px)' }}
                >
                  {`${liqThresholdPercent.toFixed(2)}%`}
                </div>
              )}
            </div>
            
          </div>

          {/* Footer: remove empty whitespace; show error inline if present */}
          {error && (
            <div className="mt-5 pt-3 border-t border-base-300 w-full text-xs text-error">{error}</div>
          )}
        </div>
      </div>
    </WidgetErrorBoundary>
  );
}


