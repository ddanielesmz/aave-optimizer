/**
 * Lazy imports per ridurre il bundle size iniziale
 * Le librerie blockchain vengono caricate solo quando necessarie
 */

// Lazy import per ethers
export const getEthers = async () => {
  const ethers = await import('ethers');
  return ethers;
};

// Lazy import per viem
export const getViem = async () => {
  const viem = await import('viem');
  return viem;
};

// Lazy import per wagmi
export const getWagmi = async () => {
  const wagmi = await import('wagmi');
  return wagmi;
};

// Lazy import per RainbowKit
export const getRainbowKit = async () => {
  const rainbowKit = await import('@rainbow-me/rainbowkit');
  return rainbowKit;
};

// Lazy import per Aave contract helpers
export const getAaveHelpers = async () => {
  const aaveHelpers = await import('@aave/contract-helpers');
  return aaveHelpers;
};

// Utility per creare provider lazy
export const createLazyProvider = async (chainId, rpcUrl) => {
  const { JsonRpcProvider } = await getEthers();
  return new JsonRpcProvider(rpcUrl, {
    name: `chain-${chainId}`,
    chainId: chainId
  });
};

// Utility per creare contratto lazy
export const createLazyContract = async (address, abi, provider) => {
  const { Contract } = await getEthers();
  return new Contract(address, abi, provider);
};
