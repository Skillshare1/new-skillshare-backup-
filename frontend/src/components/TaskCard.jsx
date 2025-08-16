import React, { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { acceptTask, submitWork } from "../lib/taskService";

const sepoliaBase = "https://sepolia.etherscan.io/tx/";
const fallback = "/defaultimg.png";

export default function TaskCard({ task, onChange }) {
  const { ready, authenticated, user, login, linkWallet } = usePrivy();
  const [localTask, setLocalTask] = useState(task);

  const walletAddr = user?.wallet?.address || null;
  const status = (localTask?.status || "").toLowerCase();
  const isOpen = status === "open";
  const isAccepted = status === "accepted";
  const isMyAccepted =
    isAccepted &&
    walletAddr &&
    walletAddr.toLowerCase() === (localTask?.worker_wallet || "").toLowerCase();

  const ensurePrivyWallet = async () => {
    if (!ready) throw new Error("Auth not ready yet.");
    if (!authenticated) {
      await login();
      // after login returns, Privy may still hydrate user; let the next click run again
      throw new Error("Please click again after connecting.");
    }
    if (!user?.wallet?.address) {
      // logged in but wallet not linked yet
      await linkWallet();
      throw new Error("Wallet linked. Click again to continue.");
    }
    return user.wallet.address;
  };

  const handleAccept = async () => {
    try {
      const addr = await ensurePrivyWallet();
      const updated = await acceptTask(localTask.id, addr);
      setLocalTask(updated);
      onChange && onChange(updated);
    } catch (err) {
      console.error("acceptTask error:", err);
      if (err?.message) alert(err.message);
    }
  };

  const handleSubmitWork = async () => {
    try {
      const addr = await ensurePrivyWallet();
      if (addr.toLowerCase() !== (localTask?.worker_wallet || "").toLowerCase()) {
        return alert("Only the assigned worker can submit.");
      }
      if (!isAccepted) {
        return alert("Task must be in 'accepted' status to submit work.");
      }
      const updated = await submitWork(localTask.id, addr);
      setLocalTask(updated);
      onChange && onChange(updated);
    } catch (err) {
      console.error("submitWork error:", err);
      if (err?.message) alert(err.message);
    }
  };

  const img = localTask?.image_url || fallback;

  return (
    <div className="bg-[#111827] text-white rounded-lg p-4 shadow">
      <img src={img} alt="task" className="w-full h-40 object-cover rounded mb-4" />
      <h3 className="font-semibold text-lg">{localTask.title}</h3>
      <p className="text-sm text-gray-300">{localTask.description}</p>

      <div className="mt-3 text-sm space-y-1">
        <div><b>Reward:</b> {localTask.reward} ETH</div>
        <div><b>Location:</b> {localTask.location}</div>
        {localTask.deadline && <div><b>Deadline:</b> {localTask.deadline}</div>}
        <div><b>Status:</b> {localTask.status}</div>
        {localTask.tx_hash && (
          <a
            href={`${sepoliaBase}${localTask.tx_hash}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 underline text-xs"
          >
            View tx
          </a>
        )}
        {localTask.worker_wallet && (
          <div className="text-xs text-gray-400 break-all">
            <b>Worker:</b> {localTask.worker_wallet}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {isOpen && (
          <button
            onClick={handleAccept}
            disabled={!ready}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              ready ? "bg-white/10 hover:bg-white/20" : "bg-gray-600 cursor-not-allowed"
            }`}
            title={!ready ? "Loading auth…" : "Accept this task"}
          >
            Accept Task
          </button>
        )}

        {isAccepted && (
          <button
            onClick={handleSubmitWork}
            disabled={!ready || !isMyAccepted}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              ready && isMyAccepted
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-600 cursor-not-allowed"
            }`}
            title={
              !ready
                ? "Loading auth…"
                : isMyAccepted
                ? "Submit your work"
                : "Only the assigned worker can submit"
            }
          >
            Submit Work
          </button>
        )}
      </div>
    </div>
  );
}
