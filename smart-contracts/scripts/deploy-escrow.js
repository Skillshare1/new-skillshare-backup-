// contracts/scripts/deploy-escrow.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying TaskEscrow with account:", (await hre.ethers.getSigners())[0].address);
  const Escrow = await hre.ethers.getContractFactory("contracts/TaskEscrow.sol:TaskEscrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  const addr = await escrow.getAddress();
  console.log("TaskEscrow deployed to:", addr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
