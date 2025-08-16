// Configuration for API keys and smart contract
export const config = {
  // Mapbox
  mapboxToken: import.meta.env.VITE_MAPBOX_API,
  
  // Wallet providers
  dynamicKey: import.meta.env.VITE_DYNAMIC_KEY,
  privyAppId: import.meta.env.VITE_PRIVY_APP_ID,
  
  // Smart Contract
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
  networkId: import.meta.env.VITE_NETWORK_ID || '11155111', // Sepolia testnet
  
  // API
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  
  // Network configurations
  networks: {
    sepolia: {
      chainId: '0xaa36a7',
      chainName: 'Sepolia Test Network',
      rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
      blockExplorerUrls: ['https://sepolia.etherscan.io/'],
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
    },
    // Add other networks as needed
  }
};

export default config;
