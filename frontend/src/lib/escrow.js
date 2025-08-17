// src/lib/escrow.js
import { ethers } from "ethers";

/** One escrow contract address. If VITE_ESCROW_ADDRESS missing, falls back to VITE_CONTRACT_ADDRESS. */
export const ESCROW_ADDRESS =
  import.meta.env.VITE_ESCROW_ADDRESS || import.meta.env.VITE_CONTRACT_ADDRESS;

/** Expected network (Flow EVM Mainnet = 747) */
const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 0);
const RPC_URL = import.meta.env.VITE_RPC_URL || null;

/**
 * ABI notes: we don't know your exact getter name, so we try a few common ones.
 * Writes are standard: fund(taskId, worker_) payable; release(taskId)
 */
const READ_FRAGMENTS = [
  "function getEscrow(uint256 taskId) view returns (address poster,address worker,uint256 amount,bool funded,bool released,bool cancelled)",
  "function escrows(uint256 taskId) view returns (address poster,address worker,uint256 amount,bool funded,bool released,bool cancelled)",
  "function tasks(uint256 taskId) view returns (address poster,address worker,uint256 amount,bool funded,bool released,bool cancelled)",
];

const WRITE_FRAGMENTS = [
  "function fund(uint256 taskId, address worker_) payable",
  "function release(uint256 taskId)",
  "event Funded(uint256 indexed taskId, address indexed poster, address indexed worker, uint256 amount)",
  "event Released(uint256 indexed taskId, address indexed poster, address indexed worker, uint256 amount)"
];

export const ESCROW_ABI = [...READ_FRAGMENTS, ...WRITE_FRAGMENTS];

// ---------- helpers ----------
function requireWindowEth() {
  if (!window.ethereum) throw new Error("Wallet not found (window.ethereum).");
}

async function getProvider() {
  requireWindowEth();
  return new ethers.BrowserProvider(window.ethereum);
}

async function getSigner() {
  const p = await getProvider();
  return p.getSigner();
}

// Ensure wallet is on the expected chain; add it if necessary
async function ensureExpectedNetwork(provider) {
  if (!EXPECTED_CHAIN_ID) return;
  const net = await provider.getNetwork();
  if (Number(net.chainId) === EXPECTED_CHAIN_ID) return;

  const hexChainId = "0x" + EXPECTED_CHAIN_ID.toString(16);
  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId: hexChainId }]);
  } catch (e) {
    if (e?.code === 4902) {
      if (!RPC_URL) {
        throw new Error(`Wrong network. chainId=${Number(net.chainId)}, expected ${EXPECTED_CHAIN_ID}. Please switch in your wallet.`);
      }
      await provider.send("wallet_addEthereumChain", [{
        chainId: hexChainId,
        chainName: `Flow EVM ${EXPECTED_CHAIN_ID === 747 ? "Mainnet" : "Network"}`,
        rpcUrls: [RPC_URL],
        nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
        blockExplorerUrls: ["https://evm.flowscan.io/"],
      }]);
      await provider.send("wallet_switchEthereumChain", [{ chainId: hexChainId }]);
    } else {
      throw e;
    }
  }
}

async function assertContractAndNetwork(provider) {
  if (!ESCROW_ADDRESS) throw new Error("ESCROW_ADDRESS not set.");
  await ensureExpectedNetwork(provider);
  const net = await provider.getNetwork();
  const code = await provider.getCode(ESCROW_ADDRESS);
  if (!code || code === "0x") {
    throw new Error(`No contract code at ${ESCROW_ADDRESS} on chainId=${Number(net.chainId)}.`);
  }
}

function parseRewardETH(reward) {
  const s = String(reward ?? "0").trim();
  if (!s || Number(s) <= 0) throw new Error("Reward must be > 0.");
  return ethers.parseEther(s);
}

function normalizeEntry(e) {
  return {
    poster: (e.poster ?? e[0] ?? "").toLowerCase?.() || "",
    worker: (e.worker ?? e[1] ?? "").toLowerCase?.() || "",
    amountWei: typeof e.amount === "bigint" ? e.amount : BigInt(e[2] || 0),
    fundedFlag: Boolean(e.funded ?? e[3]),
    released: Boolean(e.released ?? e[4]),
    cancelled: Boolean(e.cancelled ?? e[5]),
  };
}

// ---------- reads ----------
export async function readEscrow(taskId) {
  const provider = await getProvider();
  await assertContractAndNetwork(provider);

  const c = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, await getSigner());
  try { return normalizeEntry(await c.getEscrow(taskId)); } catch {}
  try { return normalizeEntry(await c.escrows(taskId)); } catch {}
  try { return normalizeEntry(await c.tasks(taskId)); } catch {}
  throw new Error(`Cannot read escrow for task ${taskId}.`);
}

/** Consider funded if enough native coin is locked and not released/cancelled (independent of worker). */
export async function isTaskFunded(task) {
  const e = await readEscrow(task.id);
  const needed = parseRewardETH(task.reward);
  return e.amountWei >= needed && !e.released && !e.cancelled;
}

// ---------- writes ----------
/** Poster funds AFTER worker is assigned; sends value = reward. */
export async function fundEscrow(task) {
  if (!task?.worker_wallet) throw new Error("Assign a worker first, then fund.");
  const provider = await getProvider();
  await assertContractAndNetwork(provider);

  const c = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, await getSigner());
  const value = parseRewardETH(task.reward);
  const tx = await c.fund(task.id, task.worker_wallet, { value });
  const receipt = await tx.wait();
  return receipt; // .hash
}

/** Poster approves -> release funds from contract to worker (contract -> worker). */
export async function releaseEscrow(taskId) {
  const provider = await getProvider();
  await assertContractAndNetwork(provider);

  const c = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, await getSigner());
  const tx = await c.release(taskId);
  const receipt = await tx.wait();
  return receipt;
}
