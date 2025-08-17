// src/utils/useContract.js
import { ethers } from "ethers";

// ✅ Correct ABI import for SkillSnap contract (for task creation)
import artifact from "../../../smart-contracts/artifacts/contracts/SkillSnap.sol/SkillSnap.json";

// ✅ Address from .env (set VITE_CONTRACT_ADDRESS after deployment)
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

/**
 * Returns an ethers.Contract instance connected to the signer.
 * Prompts the user to connect wallet if not already connected.
 */
export const getContract = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    return null;
  }

  if (!contractAddress) {
    throw new Error("Contract address is missing. Set VITE_CONTRACT_ADDRESS in your .env");
  }

  // Connect to wallet
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  // Create contract instance using ABI from artifact
  const contract = new ethers.Contract(contractAddress, artifact.abi, signer);
  return contract;
};
