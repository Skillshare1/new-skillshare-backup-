// src/lib/escrow.js
import { ethers } from "ethers";

export const ESCROW_ADDRESS =
  import.meta.env.VITE_ESCROW_ADDRESS || import.meta.env.VITE_CONTRACT_ADDRESS;

const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 0);

const READ_FRAGMENTS = [
  // try common mapping getters and explicit getter
  "function escrows(uint256 taskId) view returns (address poster,address worker,uint256 amount,bool funded,bool released,bool cancelled)",
  "function tasks(uint256 taskId) view returns (address poster,address worker,uint256 amount,bool funded,bool released,bool cancelled)",
  "function getEscrow(uint256 taskId) view returns (address poster,address worker,uint256 amount,bool funded,bool released,bool cancelled)",
];

const WRITE_FRAGMENTS = [
  // ✳️ your current contract: funding needs worker
  "function fund(uint256 taskId, address worker_) payable",
  // ✳️ your current contract: release without worker param
  "function release(uint256 taskId)",
  "event Funded(uint256 indexed taskId, address indexed poster, address indexed worker, uint256 amount)",
  "event Released(uint256 indexed taskId, address indexed poster, address indexed worker, uint256 amount)",
];

export const ESCROW_ABI = [...READ_FRAGMENTS, ...WRITE_FRAGMENTS];

function requireWindowEth() {
  if (!window.ethereum) throw new Error("Wallet not found.");
}
async function getProvider() { requireWindowEth(); return new ethers.BrowserProvider(window.ethereum); }
async function getSigner() { const p = await getProvider(); return p.getSigner(); }

async function assertContractAndNetwork(provider) {
  if (!ESCROW_ADDRESS) throw new Error("ESCROW_ADDRESS not set.");
  const net = await provider.getNetwork();
  if (EXPECTED_CHAIN_ID && Number(net.chainId) !== EXPECTED_CHAIN_ID) {
    throw new Error(`Wrong network. chainId=${net.chainId}, expected ${EXPECTED_CHAIN_ID}.`);
  }
  const code = await provider.getCode(ESCROW_ADDRESS);
  if (!code || code === "0x") throw new Error(`No contract code at ${ESCROW_ADDRESS} on chainId=${net.chainId}.`);
}

function parseRewardETH(reward) {
  const s = String(reward ?? "0").trim();
  if (!s || Number(s) <= 0) throw new Error("Reward must be > 0.");
  return ethers.parseEther(s); // wei
}

function norm(e) {
  return {
    poster: (e.poster ?? e[0] ?? "").toLowerCase?.() || "",
    worker: (e.worker ?? e[1] ?? "").toLowerCase?.() || "",
    amountWei: typeof e.amount === "bigint" ? e.amount : BigInt(e[2] || 0),
    fundedFlag: Boolean(e.funded ?? e[3]),
    released: Boolean(e.released ?? e[4]),
    cancelled: Boolean(e.cancelled ?? e[5]),
  };
}

export async function readEscrow(taskId) {
  const provider = await getProvider(); await assertContractAndNetwork(provider);
  const c = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, await getSigner());
  try { return norm(await c.getEscrow(taskId)); } catch {}
  try { return norm(await c.escrows(taskId)); } catch {}
  try { return norm(await c.tasks(taskId)); } catch {}
  throw new Error(`Cannot read escrow for task ${taskId}.`);
}

/** Consider it funded if enough ETH is locked and not released/cancelled (don’t require worker match for the UI badge). */
export async function isTaskFunded(task) {
  const e = await readEscrow(task.id);
  const needed = parseRewardETH(task.reward);
  return e.amountWei >= needed && !e.released && !e.cancelled;
}

/** Poster funds AFTER a worker is assigned. */
export async function fundEscrow(task) {
  if (!task?.worker_wallet) throw new Error("Assign a worker first, then fund.");
  const provider = await getProvider(); await assertContractAndNetwork(provider);
  const c = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, await getSigner());
  const value = parseRewardETH(task.reward);
  const tx = await c.fund(task.id, task.worker_wallet, { value });
  return await tx.wait();
}

/** Poster approves → contract pays worker (old signature). */
export async function releaseEscrow(taskId) {
  const provider = await getProvider(); await assertContractAndNetwork(provider);
  const c = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, await getSigner());
  const tx = await c.release(taskId);
  return await tx.wait();
}
