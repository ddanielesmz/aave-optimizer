/**
 * Hook ottimizzato per gestire gli stati di caricamento con debouncing e caching intelligente
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useOptimizedLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const debounceRef = useRef(null);
  const loadingTimeoutRef = useRef(null);

  // Funzione per iniziare il caricamento con debouncing
  const startLoading = useCallback((debounceMs = 100) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setIsLoading(true);
      setError(null);
      
      // Timeout di sicurezza per evitare caricamenti infiniti
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setError('Timeout: Loading took too long');
      }, 30000); // 30 secondi di timeout
    }, debounceMs);
  }, []);

  // Funzione per completare il caricamento
  const finishLoading = useCallback((success = true, errorMessage = null) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    setIsLoading(false);
    setError(success ? null : errorMessage);
    setLastUpdated(new Date());
  }, []);

  // Funzione per gestire errori
  const setLoadingError = useCallback((errorMessage) => {
    finishLoading(false, errorMessage);
  }, [finishLoading]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    error,
    lastUpdated,
    startLoading,
    finishLoading,
    setLoadingError
  };
}

/**
 * Hook per gestire il caricamento con retry automatico
 */
export function useRetryableLoading(maxRetries = 3, retryDelay = 1000) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const loadingState = useOptimizedLoading();

  const retry = useCallback(async (fetchFunction) => {
    if (retryCount >= maxRetries) {
      loadingState.setLoadingError(`Max retries (${maxRetries}) exceeded`);
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      await fetchFunction();
      setRetryCount(0); // Reset su successo
    } catch (error) {
      if (retryCount < maxRetries - 1) {
        // Aspetta prima del prossimo retry
        setTimeout(() => {
          retry(fetchFunction);
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        loadingState.setLoadingError(error.message);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, maxRetries, retryDelay, loadingState]);

  return {
    ...loadingState,
    retryCount,
    isRetrying,
    retry
  };
}

/**
 * Hook per gestire il caricamento con prefetching intelligente
 */
export function usePrefetchingLoading(prefetchFunction, prefetchDelay = 5000) {
  const [prefetchedData, setPrefetchedData] = useState(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  
  const loadingState = useOptimizedLoading();

  const prefetch = useCallback(async () => {
    if (isPrefetching) return;

    setIsPrefetching(true);
    try {
      const data = await prefetchFunction();
      setPrefetchedData(data);
    } catch (error) {
      console.log('Prefetch failed:', error.message);
    } finally {
      setIsPrefetching(false);
    }
  }, [prefetchFunction, isPrefetching]);

  // Prefetch automatico dopo un delay
  useEffect(() => {
    const timeout = setTimeout(prefetch, prefetchDelay);
    return () => clearTimeout(timeout);
  }, [prefetch, prefetchDelay]);

  return {
    ...loadingState,
    prefetchedData,
    isPrefetching,
    prefetch
  };
}

/**
 * Hook per gestire il caricamento con skeleton intelligente
 */
export function useSkeletonLoading(minLoadingTime = 500) {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [skeletonTimeout, setSkeletonTimeout] = useState(null);
  
  const loadingState = useOptimizedLoading();

  const startSkeletonLoading = useCallback(() => {
    setShowSkeleton(true);
    loadingState.startLoading();

    // Mostra skeleton per almeno il tempo minimo
    const timeout = setTimeout(() => {
      setShowSkeleton(false);
    }, minLoadingTime);

    setSkeletonTimeout(timeout);
  }, [loadingState, minLoadingTime]);

  const finishSkeletonLoading = useCallback((success = true, errorMessage = null) => {
    if (skeletonTimeout) {
      clearTimeout(skeletonTimeout);
    }

    // Aspetta il tempo minimo prima di nascondere il skeleton
    setTimeout(() => {
      setShowSkeleton(false);
      loadingState.finishLoading(success, errorMessage);
    }, minLoadingTime);
  }, [loadingState, skeletonTimeout, minLoadingTime]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (skeletonTimeout) {
        clearTimeout(skeletonTimeout);
      }
    };
  }, [skeletonTimeout]);

  return {
    ...loadingState,
    showSkeleton,
    startSkeletonLoading,
    finishSkeletonLoading
  };
}
