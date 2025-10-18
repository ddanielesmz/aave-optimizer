/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // NextJS <Image> component needs to whitelist domains for src={}
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https", 
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "logos-world.net",
      },
    ],
  },
  webpack: (config, { webpack, isServer }) => {
    // Ignore MongoDB's optional dependencies to prevent build warnings
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(kerberos|@mongodb-js\/zstd|@aws-sdk\/credential-providers|gcp-metadata|snappy|socks|aws4|mongodb-client-encryption)$/,             
        })
      );
    }
    
    // Ottimizzazioni per tree shaking delle librerie blockchain
    config.optimization = {
      ...config.optimization,
      sideEffects: false,
    };
    
    // Ottimizza le librerie pesanti
    config.resolve.alias = {
      ...config.resolve.alias,
      // Usa versioni più leggere quando possibile
      'ethers$': 'ethers/lib/index.js',
    };
    
    return config;
  },
};

module.exports = nextConfig;
