const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Escrow = await hre.ethers.getContractFactory("contracts/TaskEscrow.sol:TaskEscrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  const addr = await escrow.getAddress();

  console.log("Escrow deployed to:", addr);
  console.log("Bytecode length:", (await hre.ethers.provider.getCode(addr)).length);
}
main().catch((e) => { console.error(e); process.exit(1); });
