/**
 * Componenti skeleton per migliorare l'UX durante il caricamento
 */

// Skeleton per widget generico
export function WidgetSkeleton({ className = "" }) {
  return (
    <div className={`bg-base-100 rounded-xl shadow-md p-4 ${className}`}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-base-300 rounded w-32 animate-pulse"></div>
        <div className="h-8 w-8 bg-base-300 rounded-full animate-pulse"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-base-300 rounded w-full animate-pulse"></div>
        <div className="h-4 bg-base-300 rounded w-3/4 animate-pulse"></div>
        <div className="h-4 bg-base-300 rounded w-1/2 animate-pulse"></div>
      </div>
    </div>
  );
}

// Skeleton per Financial Summary Widget
export function FinancialSummarySkeleton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="loading loading-spinner loading-lg"></div>
      <span className="text-sm text-base-content/60">Loading financial data...</span>
    </div>
  );
}

// Skeleton per Optimization Widget
export function OptimizationSkeleton() {
  return (
    <div className="bg-base-100 rounded-xl shadow-md p-6 flex flex-col justify-between min-h-[180px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-base-300 rounded w-40 animate-pulse"></div>
        <div className="h-8 w-8 bg-base-300 rounded-full animate-pulse"></div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-base-300 rounded-full animate-pulse"></div>
          <div className="h-4 bg-base-300 rounded w-32 animate-pulse"></div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-base-300 pt-2 mt-4">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-base-300 rounded w-24 animate-pulse"></div>
          <div className="h-3 bg-base-300 rounded w-20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Skeleton per Health Factor Widget
export function HealthFactorSkeleton() {
  return (
    <div className="bg-base-100 rounded-xl shadow-md p-6 flex flex-col justify-between min-h-[180px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-base-300 rounded w-32 animate-pulse"></div>
        <div className="h-8 w-8 bg-base-300 rounded-full animate-pulse"></div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Health Factor Value */}
          <div className="h-16 w-20 bg-base-300 rounded animate-pulse"></div>
          
          {/* Status */}
          <div className="h-6 bg-base-300 rounded w-16 animate-pulse"></div>
          
          {/* Progress Bar */}
          <div className="w-full px-2">
            <div className="flex justify-between text-xs mb-1">
              <div className="h-3 bg-base-300 rounded w-4 animate-pulse"></div>
              <div className="h-3 bg-base-300 rounded w-4 animate-pulse"></div>
            </div>
            
            <div className="w-full bg-base-200 rounded-full h-3.5 overflow-hidden">
              <div className="h-3.5 bg-base-300 rounded-full animate-pulse w-3/4"></div>
            </div>
            
            <div className="flex justify-between text-xs mt-1">
              <div className="h-3 bg-base-300 rounded w-8 animate-pulse"></div>
              <div className="h-3 bg-base-300 rounded w-8 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-base-300 pt-3 mt-4">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-base-300 rounded w-32 animate-pulse"></div>
          <div className="h-3 bg-base-300 rounded w-20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Skeleton per Network Switch
export function NetworkSwitchSkeleton() {
  return (
    <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
      <div className="h-4 w-4 bg-base-300 rounded-full animate-pulse"></div>
      <div className="h-4 bg-base-300 rounded w-20 animate-pulse"></div>
      <div className="h-4 w-4 bg-base-300 rounded animate-pulse"></div>
    </div>
  );
}

// Skeleton per Loading States con animazione fluida
export function SmoothSkeleton({ className = "", width = "w-full", height = "h-4" }) {
  return (
    <div className={`bg-gradient-to-r from-base-300 via-base-200 to-base-300 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded ${width} ${height} ${className}`}></div>
  );
}

// Skeleton per Dashboard Grid
export function DashboardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-base-100 rounded-xl shadow-md p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <SmoothSkeleton width="w-32" height="h-6" />
            <SmoothSkeleton width="w-8" height="h-8" className="rounded-full" />
          </div>
          
          {/* Content */}
          <div className="space-y-4">
            <SmoothSkeleton width="w-full" height="h-12" className="rounded-lg" />
            <SmoothSkeleton width="w-3/4" height="h-4" />
            <SmoothSkeleton width="w-1/2" height="h-4" />
          </div>
          
          {/* Footer */}
          <div className="border-t border-base-300 pt-4 mt-4">
            <div className="flex items-center justify-between">
              <SmoothSkeleton width="w-24" height="h-3" />
              <SmoothSkeleton width="w-20" height="h-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton per Wallet Connection
export function WalletConnectionSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 bg-base-100 rounded-xl border border-base-300">
      <SmoothSkeleton width="w-10" height="h-10" className="rounded-full" />
      <div className="flex-1">
        <SmoothSkeleton width="w-32" height="h-4" className="mb-2" />
        <SmoothSkeleton width="w-24" height="h-3" />
      </div>
      <SmoothSkeleton width="w-8" height="h-8" className="rounded-full" />
    </div>
  );
}

// Skeleton per lista di posizioni
export function PositionsListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-base-300 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-base-300 rounded-full animate-pulse"></div>
              <div className="h-4 bg-base-300 rounded w-16 animate-pulse"></div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-base-300 rounded w-20 animate-pulse mb-1"></div>
              <div className="h-3 bg-base-300 rounded w-16 animate-pulse"></div>
            </div>
          </div>
          <div className="bg-base-200 rounded p-2">
            <div className="h-3 bg-base-300 rounded w-full animate-pulse mb-1"></div>
            <div className="h-3 bg-base-300 rounded w-3/4 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton per metriche
export function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-base-200 rounded-lg p-4">
          <div className="h-4 bg-base-300 rounded w-20 mb-2 animate-pulse"></div>
          <div className="h-8 bg-base-300 rounded w-24 mb-2 animate-pulse"></div>
          <div className="h-3 bg-base-300 rounded w-32 animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

// Skeleton per tabella
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-base-300 rounded animate-pulse"></div>
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4 mb-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-base-300 rounded animate-pulse"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton per card
export function CardSkeleton({ title = true, content = true, footer = true }) {
  return (
    <div className="bg-base-100 rounded-xl shadow-md p-6">
      {title && (
        <div className="h-6 bg-base-300 rounded w-32 mb-4 animate-pulse"></div>
      )}
      
      {content && (
        <div className="space-y-3 mb-4">
          <div className="h-4 bg-base-300 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-base-300 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-base-300 rounded w-1/2 animate-pulse"></div>
        </div>
      )}
      
      {footer && (
        <div className="border-t border-base-300 pt-4">
          <div className="h-4 bg-base-300 rounded w-24 animate-pulse"></div>
        </div>
      )}
    </div>
  );
}
