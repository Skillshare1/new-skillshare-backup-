import "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";
dotenv.config();

const with0x = (k) => (k?.startsWith("0x") ? k : (k ? "0x" + k : undefined));

// Debug logs
console.log('RPC:', process.env.SEPOLIA_RPC, 'KEY:', process.env.DEPLOYER_KEY?.slice(0,6)+'...');

export default {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC,
      accounts: process.env.DEPLOYER_KEY ? [with0x(process.env.DEPLOYER_KEY)] : [],
      chainId: 11155111,
    },
    // add zircuit/base/flow-evm after Sepolia is green
  },
};
