"use client";

import { useState, useEffect } from 'react';
import CoinLogoFallback from './CoinLogoFallback';

const CoinLogo = ({ symbol, size = 24, className = "" }) => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // URL diretti di CoinGecko per ogni coin
        const coinGeckoUrls = {
          'USDC': 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
          'USDC.e': 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
          'USDT': 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
          'DAI': 'https://assets.coingecko.com/coins/images/9956/large/4943.png',
          'FRAX': 'https://assets.coingecko.com/coins/images/13422/large/frax_logo.png',
          'GHO': 'https://assets.coingecko.com/coins/images/30663/large/gho.png',
          'LUSD': 'https://assets.coingecko.com/coins/images/14666/large/Group_3.png',
          'WETH': 'https://assets.coingecko.com/coins/images/2518/large/weth.png',
          'WBTC': 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png',
          'ARB': 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg',
          'ETH': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          'BTC': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
        };
        
        const logoUrl = coinGeckoUrls[symbol];
        
        if (!logoUrl) {
          throw new Error(`No logo URL found for ${symbol}`);
        }
        
        // Imposta direttamente l'URL senza verificare l'esistenza (evita problemi CORS)
        setLogoUrl(logoUrl);
        
      } catch (error) {
        console.error(`Error setting logo for ${symbol}:`, error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogo();
  }, [symbol]);

  // Se è in caricamento, mostra un placeholder
  if (isLoading) {
    return (
      <div 
        className={`bg-gray-200 rounded-full flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="animate-pulse bg-gray-300 rounded-full" style={{ width: size * 0.6, height: size * 0.6 }}></div>
      </div>
    );
  }

  // Se c'è un errore o non abbiamo URL, usa il fallback
  if (hasError || !logoUrl) {
    return <CoinLogoFallback symbol={symbol} size={size} className={className} />;
  }

  return (
    <img
      src={logoUrl}
      alt={`${symbol} logo`}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
      onError={() => {
        console.error(`Failed to load logo for ${symbol}`);
        setHasError(true);
      }}
      onLoad={() => {
        console.log(`Successfully loaded logo for ${symbol}`);
      }}
    />
  );
};

export default CoinLogo;
