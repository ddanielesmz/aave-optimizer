"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { NetworkSwitchSkeleton } from './SkeletonLoader';

const NETWORK_CONFIG = {
  1: { name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500' },
  137: { name: 'Polygon', symbol: 'MATIC', color: 'bg-purple-500' },
  10: { name: 'Optimism', symbol: 'ETH', color: 'bg-red-500' },
  42161: { name: 'Arbitrum', symbol: 'ETH', color: 'bg-blue-600' },
  43114: { name: 'Avalanche', symbol: 'AVAX', color: 'bg-orange-500' }
};

export default function NetworkSwitchOptimized() {
  const { chainId, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchTimeout, setSwitchTimeout] = useState(null);

  // Gestione timeout per switch
  useEffect(() => {
    if (isSwitching && !isPending) {
      const timeout = setTimeout(() => {
        setIsSwitching(false);
      }, 2000); // 2 secondi di timeout
      
      setSwitchTimeout(timeout);
    }

    return () => {
      if (switchTimeout) {
        clearTimeout(switchTimeout);
      }
    };
  }, [isSwitching, isPending, switchTimeout]);

  const handleNetworkSwitch = useCallback(async (targetChainId) => {
    if (targetChainId === chainId || isPending || isSwitching) {
      return;
    }

    try {
      setIsSwitching(true);
      await switchChain({ chainId: targetChainId });
    } catch (error) {
      console.error('Network switch error:', error);
      setIsSwitching(false);
    }
  }, [chainId, isPending, isSwitching, switchChain]);

  const getNetworkName = (chainId) => {
    return NETWORK_CONFIG[chainId]?.name || 'Unknown';
  };

  const getNetworkColor = (chainId) => {
    return NETWORK_CONFIG[chainId]?.color || 'bg-gray-500';
  };

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
        <div className="h-4 w-4 bg-base-300 rounded-full"></div>
        <span className="text-sm text-base-content/60">Connect Wallet</span>
      </div>
    );
  }

  if (isSwitching || isPending) {
    return <NetworkSwitchSkeleton />;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Network corrente */}
      <div className="flex items-center gap-2 p-2 bg-base-100 rounded-lg border border-base-300">
        <div className={`h-3 w-3 rounded-full ${getNetworkColor(chainId)}`}></div>
        <span className="text-sm font-medium">{getNetworkName(chainId)}</span>
      </div>

      {/* Dropdown per altre reti */}
      <div className="relative group">
        <button className="btn btn-ghost btn-sm btn-circle">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Dropdown menu */}
        <div className="absolute right-0 top-full mt-2 w-48 bg-base-100 rounded-lg shadow-lg border border-base-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="py-2">
            {Object.entries(NETWORK_CONFIG).map(([chainIdStr, config]) => {
              const id = parseInt(chainIdStr);
              const isCurrent = id === chainId;
              
              return (
                <button
                  key={id}
                  onClick={() => handleNetworkSwitch(id)}
                  disabled={isCurrent || isSwitching}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-base-200 transition-colors duration-150 flex items-center gap-3 ${
                    isCurrent ? 'text-base-content/60 cursor-not-allowed' : 'text-base-content'
                  }`}
                >
                  <div className={`h-3 w-3 rounded-full ${config.color}`}></div>
                  <span>{config.name}</span>
                  {isCurrent && (
                    <svg className="w-4 h-4 ml-auto text-success" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
