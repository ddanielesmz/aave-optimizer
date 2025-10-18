"use client";

import React, { Suspense, memo } from 'react';
import { useAccount } from 'wagmi';
import { WidgetErrorBoundary } from '@/components/ErrorBoundaryOptimized';
import NetworkSwitchOptimized from '@/components/NetworkSwitchOptimized';
import AaveHealthWidget from './AaveHealthWidget';
import CurrentLTVWidget from './CurrentLTVWidget';

// Lazy loading dei componenti pesanti
const NetAPYCard = React.lazy(() => import('./NetAPYCard'));
const NetMetrics = React.lazy(() => import('./NetMetrics'));
const StablecoinSupplyOptimizer = React.lazy(() => import('./StablecoinSupplyOptimizer'));
const StablecoinBorrowOptimizer = React.lazy(() => import('./StablecoinBorrowOptimizer'));

function DashboardContent() {
  const { isConnected, address } = useAccount();

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-base-content">DeFi Dashboard</h1>
          <NetworkSwitchOptimized />
        </div>
        
        <div className="bg-base-100 rounded-xl shadow-md p-6 flex flex-col items-center justify-center min-h-[180px]">
          <div className="loading loading-spinner loading-md mb-4"></div>
          <div className="text-sm text-base-content/60">Connect your wallet to view dashboard</div>
        </div>
        
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-base-content mb-2">Connect Your Wallet</h2>
          <p className="text-base-content/60 mb-6">Connect your wallet to view your DeFi positions and optimize your yields</p>
          <button className="btn btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content">DeFi Dashboard</h1>
          <p className="text-base-content/60 mt-1">
            Welcome back! Here&apos;s your portfolio overview
          </p>
        </div>
        <NetworkSwitchOptimized />
      </div>

      {/* Wallet Info */}
      <div className="bg-base-100 rounded-xl p-4 border border-base-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-base-content">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown Address'}
            </p>
            <p className="text-sm text-base-content/60">Connected Wallet</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-success">● Online</div>
            <div className="text-xs text-base-content/60">Last updated: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Current LTV Widget */}
        <WidgetErrorBoundary fallbackMessage="Unable to load LTV data">
          <CurrentLTVWidget />
        </WidgetErrorBoundary>

        {/* Health Factor Widget */}
        <WidgetErrorBoundary fallbackMessage="Unable to load health factor data">
          <AaveHealthWidget />
        </WidgetErrorBoundary>

        {/* Net APY Card */}
        <WidgetErrorBoundary fallbackMessage="Unable to load APY data">
          <Suspense fallback={
            <div className="bg-base-100 rounded-xl shadow-md p-6 flex flex-col items-center justify-center min-h-[180px]">
              <div className="loading loading-spinner loading-md mb-2"></div>
              <div className="text-sm text-base-content/60">Loading...</div>
            </div>
          }>
            <NetAPYCard />
          </Suspense>
        </WidgetErrorBoundary>

        {/* Net Metrics */}
        <WidgetErrorBoundary fallbackMessage="Unable to load metrics data">
          <Suspense fallback={
            <div className="bg-base-100 rounded-xl shadow-md p-6 flex flex-col items-center justify-center min-h-[180px]">
              <div className="loading loading-spinner loading-md mb-2"></div>
              <div className="text-sm text-base-content/60">Loading...</div>
            </div>
          }>
            <NetMetrics />
          </Suspense>
        </WidgetErrorBoundary>

        {/* Supply Optimizer */}
        <WidgetErrorBoundary fallbackMessage="Unable to load supply optimizer">
          <Suspense fallback={
            <div className="bg-base-100 rounded-xl shadow-md p-6 flex flex-col items-center justify-center min-h-[180px]">
              <div className="loading loading-spinner loading-md mb-2"></div>
              <div className="text-sm text-base-content/60">Loading...</div>
            </div>
          }>
            <StablecoinSupplyOptimizer />
          </Suspense>
        </WidgetErrorBoundary>

        {/* Borrow Optimizer */}
        <WidgetErrorBoundary fallbackMessage="Unable to load borrow optimizer">
          <Suspense fallback={
            <div className="bg-base-100 rounded-xl shadow-md p-6 flex flex-col items-center justify-center min-h-[180px]">
              <div className="loading loading-spinner loading-md mb-2"></div>
              <div className="text-sm text-base-content/60">Loading...</div>
            </div>
          }>
            <StablecoinBorrowOptimizer />
          </Suspense>
        </WidgetErrorBoundary>
      </div>

      {/* Performance Tips */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-base-content mb-2">Performance Tips</h3>
            <ul className="text-sm text-base-content/80 space-y-1">
              <li>• Switch networks seamlessly with optimized loading states</li>
              <li>• Data is cached for faster subsequent loads</li>
              <li>• Prefetching ensures smooth network transitions</li>
              <li>• Auto-refresh keeps your data up-to-date</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const DashboardOptimized = memo(() => {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <DashboardContent />
      </div>
    </div>
  );
});

DashboardOptimized.displayName = 'DashboardOptimized';

export default DashboardOptimized;
