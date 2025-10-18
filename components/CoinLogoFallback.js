"use client";

const CoinLogoFallback = ({ symbol, size = 24, className = "" }) => {
  // URL statici per i loghi più comuni - usando URL più affidabili
  const staticLogos = {
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

  const logoUrl = staticLogos[symbol];
  
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${symbol} logo`}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
        onError={(e) => {
          console.error(`Failed to load static logo for ${symbol}`);
          e.target.style.display = 'none';
        }}
      />
    );
  }

  // Fallback finale con icona colorata
  const getColorForSymbol = (symbol) => {
    const colors = {
      'USDC': 'from-blue-500 to-blue-600',
      'USDC.e': 'from-blue-500 to-blue-600',
      'USDT': 'from-green-500 to-green-600',
      'DAI': 'from-yellow-500 to-yellow-600',
      'FRAX': 'from-gray-800 to-gray-900',
      'GHO': 'from-emerald-400 to-emerald-500',
      'LUSD': 'from-gray-600 to-gray-700',
      'WETH': 'from-purple-500 to-purple-600',
      'WBTC': 'from-orange-500 to-orange-600',
      'ARB': 'from-blue-600 to-blue-700',
      'ETH': 'from-purple-500 to-purple-600',
      'BTC': 'from-orange-500 to-orange-600'
    };
    return colors[symbol] || 'from-blue-500 to-purple-600';
  };

  return (
    <div 
      className={`bg-gradient-to-br ${getColorForSymbol(symbol)} rounded-full flex items-center justify-center text-white font-bold text-xs ${className}`}
      style={{ width: size, height: size }}
    >
      {symbol.charAt(0)}
    </div>
  );
};

export default CoinLogoFallback;
