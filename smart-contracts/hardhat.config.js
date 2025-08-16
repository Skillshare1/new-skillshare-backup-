require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Function to get accounts array safely
function getAccounts() {
  const privateKey = process.env.PRIVATE_KEY;
  if (privateKey && privateKey.length === 66 && privateKey.startsWith('0x')) {
    return [privateKey];
  }
  return []; // Return empty array if no valid private key
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Local development network
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // Sepolia testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: getAccounts(),
      chainId: 11155111, // Sepolia chain ID
      gasPrice: 20000000000, // 20 gwei
    },
    // Zircuit L2 Testnet
    zircuit: {
      url: process.env.ZIRCUIT_RPC || "https://zircuit1-testnet.p2pify.com",
      accounts: getAccounts(),
      chainId: 48899, // Zircuit testnet chain ID
      gasPrice: 1000000000, // 1 gwei (much cheaper than mainnet)
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      zircuit: process.env.ZIRCUIT_API_KEY || "dummy"
    },
    customChains: [
      {
        network: "zircuit",
        chainId: 48899,
        urls: {
          apiURL: "https://explorer.zircuit.com/api",
          browserURL: "https://explorer.zircuit.com"
        }
      }
    ]
  }
};
