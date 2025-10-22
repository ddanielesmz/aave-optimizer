/**
 * Hook personalizzato per gestire i dati Aave con caching e ottimizzazioni
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { isAaveSupported } from './aaveConfig';
import { withCache, cacheKeys, invalidateUserCache, invalidateChainCache, prefetchNetworkData } from './aaveCache';

let aaveOnchainModulePromise;

async function getAaveOnchainModule() {
  if (!aaveOnchainModulePromise) {
    aaveOnchainModulePromise = import('./aaveOnchain');
  }
  return aaveOnchainModulePromise;
}

/**
 * Hook per dati dell'account utente
 */
export function useAaveUserData() {
  const { address, chainId } = useAccount();
  const [data, setData] = useState({
    userAccountData: null,
    supplyPositions: [],
    borrowPositions: [],
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  // Ref per debouncing
  const debounceRef = useRef(null);
  const lastChainIdRef = useRef(chainId);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!address || !chainId || !isAaveSupported(chainId)) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: !address ? 'Wallet not connected' : 
               !chainId ? 'Network not selected' :
               'Aave not supported on this network'
      }));
      return;
    }

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const {
        fetchAaveUserAccountData,
        fetchUserStablecoinSupplyPositionsOnchain,
        fetchUserStablecoinBorrowPositionsOnchain,
      } = await getAaveOnchainModule();

      // Se è un refresh forzato, invalida la cache prima
      if (forceRefresh) {
        invalidateUserCache(address, chainId);
      }

      // Fetch tutti i dati in parallelo con caching
      const [userAccountData, supplyPositions, borrowPositions] = await Promise.all([
        withCache(
          cacheKeys.userAccountData(address, chainId),
          fetchAaveUserAccountData,
          address,
          chainId,
          forceRefresh
        ),
        withCache(
          cacheKeys.supplyPositions(address, chainId),
          fetchUserStablecoinSupplyPositionsOnchain,
          address,
          chainId,
          forceRefresh
        ),
        withCache(
          cacheKeys.borrowPositions(address, chainId),
          fetchUserStablecoinBorrowPositionsOnchain,
          address,
          chainId,
          forceRefresh
        )
      ]);

      setData({
        userAccountData,
        supplyPositions: supplyPositions || [],
        borrowPositions: borrowPositions || [],
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });

      // Prefetch dati per altre reti dopo il fetch principale
      prefetchNetworkData(address, chainId);

    } catch (error) {
      console.error('Error fetching user data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch user data'
      }));
    }
  }, [address, chainId]);

  // Debounced fetch per evitare troppi refetch durante lo switch
  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchData();
    }, 300); // 300ms di debounce
  }, [fetchData]);

  useEffect(() => {
    // Se la chain è cambiata, fetch immediato
    if (lastChainIdRef.current !== chainId) {
      lastChainIdRef.current = chainId;
      fetchData();
    } else {
      // Altrimenti usa debounced fetch
      debouncedFetch();
    }
    
    // Auto-refresh ogni 60 secondi (ridotto da 30)
    const interval = setInterval(fetchData, 60000);
    
    return () => {
      clearInterval(interval);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchData, debouncedFetch, chainId]);

  return {
    ...data,
    refetch: fetchData,
    forceRefresh: () => fetchData(true)
  };
}

/**
 * Hook per dati di ottimizzazione supply
 */
export function useAaveSupplyOptimization() {
  const { address, chainId } = useAccount();
  const [data, setData] = useState({
    positions: [],
    allAPYs: [],
    recommendations: [],
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!address || !chainId || !isAaveSupported(chainId)) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: !address ? 'Wallet not connected' : 
               !chainId ? 'Network not selected' :
               'Aave not supported on this network'
      }));
      return;
    }

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const {
        fetchUserStablecoinSupplyPositionsOnchain,
        fetchStablecoinAPYsOnchain,
      } = await getAaveOnchainModule();

      // Se è un refresh forzato, invalida la cache prima
      if (forceRefresh) {
        invalidateUserCache(address, chainId);
        invalidateChainCache(chainId);
      }

      // Fetch dati in parallelo con caching
      const [userPositions, allAPYs] = await Promise.all([
        withCache(
          cacheKeys.supplyPositions(address, chainId),
          fetchUserStablecoinSupplyPositionsOnchain,
          address,
          chainId,
          forceRefresh
        ),
        withCache(
          cacheKeys.stablecoinAPYs(chainId),
          fetchStablecoinAPYsOnchain,
          chainId,
          forceRefresh
        )
      ]);

      // Genera raccomandazioni
      const recommendations = (userPositions || []).map(position => {
        const bestAlternative = findBestAlternativeAPY(position, allAPYs || [], 0.001);
        return {
          ...position,
          bestAlternative
        };
      });

      setData({
        positions: userPositions || [],
        allAPYs: allAPYs || [],
        recommendations,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error fetching supply optimization data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch optimization data'
      }));
    }
  }, [address, chainId]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh ogni 60 secondi
    const interval = setInterval(fetchData, 60000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    ...data,
    refetch: fetchData,
    forceRefresh: () => fetchData(true)
  };
}

/**
 * Hook per dati di ottimizzazione borrow
 */
export function useAaveBorrowOptimization() {
  const { address, chainId } = useAccount();
  const [data, setData] = useState({
    positions: [],
    allRates: [],
    recommendations: [],
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!address || !chainId || !isAaveSupported(chainId)) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: !address ? 'Wallet not connected' : 
               !chainId ? 'Network not selected' :
               'Aave not supported on this network'
      }));
      return;
    }

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const {
        fetchUserStablecoinBorrowPositionsOnchain,
        fetchStablecoinBorrowRatesOnchain,
      } = await getAaveOnchainModule();

      // Se è un refresh forzato, invalida la cache prima
      if (forceRefresh) {
        invalidateUserCache(address, chainId);
        invalidateChainCache(chainId);
      }

      // Fetch dati in parallelo con caching
      const [userPositions, allRates] = await Promise.all([
        withCache(
          cacheKeys.borrowPositions(address, chainId),
          fetchUserStablecoinBorrowPositionsOnchain,
          address,
          chainId,
          forceRefresh
        ),
        withCache(
          cacheKeys.stablecoinBorrowRates(chainId),
          fetchStablecoinBorrowRatesOnchain,
          chainId,
          forceRefresh
        )
      ]);

      // Genera raccomandazioni
      const recommendations = (userPositions || []).map(position => {
        const bestAlternative = findBestAlternativeRate(position, allRates || [], 0.001);
        return {
          ...position,
          bestAlternative
        };
      });

      setData({
        positions: userPositions || [],
        allRates: allRates || [],
        recommendations,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error fetching borrow optimization data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch optimization data'
      }));
    }
  }, [address, chainId]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh ogni 60 secondi
    const interval = setInterval(fetchData, 60000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    ...data,
    refetch: fetchData,
    forceRefresh: () => fetchData(true)
  };
}

/**
 * Hook per dati di health factor
 */
export function useAaveHealthFactor() {
  const { address, chainId } = useAccount();
  const [data, setData] = useState({
    healthFactor: null,
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!address || !chainId || !isAaveSupported(chainId)) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: !address ? 'Wallet not connected' : 
               !chainId ? 'Network not selected' :
               'Aave not supported on this network'
      }));
      return;
    }

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const { fetchAaveUserAccountData } = await getAaveOnchainModule();

      // Se è un refresh forzato, invalida la cache prima
      if (forceRefresh) {
        invalidateUserCache(address, chainId);
      }

      const userAccountData = await withCache(
        cacheKeys.userAccountData(address, chainId),
        fetchAaveUserAccountData,
        address,
        chainId,
        forceRefresh
      );

      if (userAccountData && userAccountData.healthFactor !== undefined) {
        // Se non ci sono debiti (totalDebt = 0), l'health factor dovrebbe essere infinito
        // Aave restituisce un valore molto grande invece di Infinity
        let normalizedHealthFactor = userAccountData.healthFactor;
        
        // Controlla se l'utente ha debiti attivi
        if (userAccountData.totalDebt === 0 || userAccountData.totalDebt < 0.01) {
          normalizedHealthFactor = Infinity;
        } else if (userAccountData.healthFactor > 1e50) {
          // Se il valore è troppo grande (probabilmente notazione scientifica), considera come infinito
          normalizedHealthFactor = Infinity;
        }
        
        setData({
          healthFactor: normalizedHealthFactor,
          isLoading: false,
          error: null,
          lastUpdated: new Date()
        });
      } else {
        setData({
          healthFactor: 0,
          isLoading: false,
          error: 'No Aave positions found'
        });
      }

    } catch (error) {
      console.error('Error fetching health factor:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch health factor'
      }));
    }
  }, [address, chainId]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh ogni 30 secondi
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    ...data,
    refetch: fetchData,
    forceRefresh: () => fetchData(true)
  };
}

/**
 * Utility per trovare la migliore alternativa APY
 */
function findBestAlternativeAPY(position, allAPYs, minImprovement) {
  const alternatives = allAPYs.filter(apy => 
    apy.symbol !== position.symbol && 
    apy.apy > position.currentAPY + minImprovement
  );
  
  if (alternatives.length === 0) return null;
  
  const best = alternatives.reduce((best, current) => 
    current.apy > best.apy ? current : best
  );
  
  return {
    symbol: best.symbol,
    apy: best.apy,
    improvement: best.apy - position.currentAPY
  };
}

/**
 * Utility per trovare la migliore alternativa di tasso
 */
function findBestAlternativeRate(position, allRates, minImprovement) {
  const alternatives = allRates.filter(rate => 
    rate.symbol !== position.symbol && 
    rate.bestRate < position.currentBorrowRate - minImprovement
  );
  
  if (alternatives.length === 0) return null;
  
  const best = alternatives.reduce((best, current) => 
    current.bestRate < best.bestRate ? current : best
  );
  
  return {
    symbol: best.symbol,
    rate: best.bestRate,
    improvement: position.currentBorrowRate - best.bestRate,
    rateType: best.variableRate < best.stableRate ? 'variable' : 'stable'
  };
}

/**
 * Hook per invalidare cache quando necessario
 */
export function useAaveCacheInvalidation() {
  const { address, chainId } = useAccount();
  
  const invalidateUserData = useCallback(() => {
    if (address && chainId) {
      invalidateUserCache(address, chainId);
    }
  }, [address, chainId]);

  return {
    invalidateUserData
  };
}

/**
 * Hook realtime per i dati account Aave (senza cache) per massima accuratezza
 * Aggiorna a intervallo regolare e su refetch manuale.
 */
export function useAaveUserAccountDataRealtime(refreshIntervalMs = 15000) {
  const { address, chainId } = useAccount();
  const [state, setState] = useState({
    userAccountData: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchNow = useCallback(async () => {
    if (!address || !chainId || !isAaveSupported(chainId)) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: !address ? 'Wallet not connected' :
               !chainId ? 'Network not selected' :
               'Aave not supported on this network'
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const { fetchAaveUserAccountData } = await getAaveOnchainModule();
      const fresh = await fetchAaveUserAccountData(address, chainId); // NO CACHE
      setState({
        userAccountData: fresh,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (e) {
      setState(prev => ({ ...prev, isLoading: false, error: e.message || 'Failed to fetch' }));
    }
  }, [address, chainId]);

  useEffect(() => {
    fetchNow();
    if (refreshIntervalMs > 0) {
      const id = setInterval(fetchNow, refreshIntervalMs);
      return () => clearInterval(id);
    }
  }, [fetchNow, refreshIntervalMs]);

  return { ...state, refetch: fetchNow };
}
