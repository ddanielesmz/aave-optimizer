/**
 * Configurazione ottimizzata per le performance
 * Riduce il bundle size e migliora i tempi di caricamento
 */

export const PERFORMANCE_CONFIG = {
  // Configurazione per lazy loading
  lazyLoading: {
    enabled: true,
    // Librerie da caricare solo quando necessarie
    heavyLibraries: [
      'ethers',
      'viem', 
      'wagmi',
      '@rainbow-me/rainbowkit',
      '@aave/contract-helpers'
    ],
    // Delay per evitare caricamenti simultanei
    loadDelay: 100
  },

  // Configurazione per tree shaking
  treeShaking: {
    enabled: true,
    // Moduli da escludere dal bundle
    excludeModules: [
      'ethers/lib/utils',
      'ethers/lib/wordlists',
      'viem/chains',
      'wagmi/chains'
    ]
  },

  // Configurazione per caching
  caching: {
    enabled: true,
    // Cache per provider blockchain
    providerCache: {
      ttl: 300000, // 5 minuti
      maxSize: 10
    },
    // Cache per dati Aave
    aaveCache: {
      ttl: 60000, // 1 minuto
      maxSize: 50
    }
  },

  // Configurazione per compressione
  compression: {
    enabled: true,
    // Livello di compressione (1-9)
    level: 6,
    // Soglia minima per compressione (bytes)
    threshold: 1024
  },

  // Configurazione per monitoring
  monitoring: {
    enabled: true,
    // Log delle performance
    logPerformance: true,
    // Soglia per warning (ms)
    warningThreshold: 1000,
    // Soglia per error (ms)
    errorThreshold: 5000
  }
};

// Utility per misurare le performance
export const performanceMonitor = {
  start: (label) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${label}-start`);
    }
  },
  
  end: (label) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${label}-end`);
      window.performance.measure(label, `${label}-start`, `${label}-end`);
      
      const measure = window.performance.getEntriesByName(label)[0];
      const duration = measure.duration;
      
      if (PERFORMANCE_CONFIG.monitoring.logPerformance) {
        console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
        
        if (duration > PERFORMANCE_CONFIG.monitoring.errorThreshold) {
          console.error(`[Performance] ${label} troppo lento: ${duration.toFixed(2)}ms`);
        } else if (duration > PERFORMANCE_CONFIG.monitoring.warningThreshold) {
          console.warn(`[Performance] ${label} lento: ${duration.toFixed(2)}ms`);
        }
      }
      
      return duration;
    }
    return 0;
  }
};

// Utility per debounce
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Utility per throttle
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
