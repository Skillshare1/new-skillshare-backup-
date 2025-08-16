// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const SkillSnap = await ethers.getContractFactory("SkillSnap");
  const skillSnap = await SkillSnap.deploy();
  await skillSnap.deployed();

  console.log("SkillSnap deployed to:", skillSnap.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
