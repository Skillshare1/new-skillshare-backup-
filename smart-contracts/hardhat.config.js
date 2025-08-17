// contracts/hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const with0x = (k) => (k && k.startsWith("0x") ? k : k ? "0x" + k : undefined);

module.exports = {
  solidity: "0.8.24",
  networks: {
    // Flow EVM Mainnet
    flowEvmMainnet: {
      url: process.env.FLOW_EVM_MAINNET_RPC,
      accounts: process.env.DEPLOYER_KEY ? [with0x(process.env.DEPLOYER_KEY)] : [],
    },
    // (optional) keep your old Sepolia config if you want
    // sepolia: { url: process.env.SEPOLIA_RPC, accounts: process.env.DEPLOYER_KEY ? [with0x(process.env.DEPLOYER_KEY)] : [] },
  },
};
