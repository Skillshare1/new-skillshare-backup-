// src/components/TaskCard.jsx
import React, { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  acceptTask,
  submitWork,
  approveTask,
  requestChanges,
  markPaid,
} from "../lib/taskService";
import { fundEscrow, releaseEscrow, isTaskFunded } from "../lib/escrow";

const etherscanBase = "https://sepolia.etherscan.io/tx/";
const fallback = "/defaultimg.png";

export default function TaskCard({ task, onChange }) {
  const { ready, authenticated, user, login, linkWallet } = usePrivy();
  const [localTask, setLocalTask] = useState(task);
  const [busy, setBusy] = useState(false);
  const [funded, setFunded] = useState(null); // null=unknown

  const walletAddr = user?.wallet?.address || null;
  const isPoster =
    walletAddr &&
    localTask?.poster_wallet &&
    walletAddr.toLowerCase() === localTask.poster_wallet.toLowerCase();

  const status = (localTask?.status || "").toLowerCase();
  const isOpen = status === "open";
  const isAccepted = status === "accepted";
  const isSubmitted = status === "submitted";
  const isCompleted = status === "completed";
  const isPaid = status === "paid";

  const isMyAccepted =
    isAccepted &&
    walletAddr &&
    walletAddr.toLowerCase() === (localTask?.worker_wallet || "").toLowerCase();

  const ensureWallet = async () => {
    if (!ready) throw new Error("Auth not ready.");
    if (!authenticated) { await login(); throw new Error("Connect then click again."); }
    if (!user?.wallet?.address) { await linkWallet(); throw new Error("Wallet linked. Click again."); }
    return user.wallet.address;
  };

  const refreshFunding = async (t = localTask) => {
    try {
      if (!t?.id) return setFunded(false);
      const ok = await isTaskFunded(t);
      setFunded(ok);
    } catch (e) {
      console.warn("funding check failed:", e.message);
      setFunded(false);
    }
  };

  useEffect(() => {
    if (isPoster && (isAccepted || isSubmitted)) refreshFunding(localTask);
    else setFunded(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTask?.id, localTask?.status, localTask?.worker_wallet, isPoster]);

  // Actions
  const doAccept = async () => {
    try {
      setBusy(true);
      const addr = await ensureWallet();
      const updated = await acceptTask(localTask.id, addr);
      setLocalTask(updated);
      onChange && onChange(updated);
    } catch (e) { alert(e.message); } finally { setBusy(false); }
  };

  const doSubmit = async () => {
    try {
      setBusy(true);
      const addr = await ensureWallet();
      if (addr.toLowerCase() !== (localTask?.worker_wallet || "").toLowerCase())
        return alert("Only the assigned worker can submit.");
      const url = window.prompt("Submission URL:", localTask.submission_url || "");
      const notes = window.prompt("Notes (optional):", localTask.submission_notes || "");
      const updated = await submitWork(localTask.id, addr, { url, notes });
      setLocalTask(updated);
      onChange && onChange(updated);
    } catch (e) { alert(e.message); } finally { setBusy(false); }
  };

  const doFund = async () => {
    try {
      setBusy(true);
      if (!isPoster) return alert("Only the poster can fund.");
      if (!localTask?.worker_wallet) return alert("No worker assigned yet.");
      const r = await fundEscrow(localTask); // value = reward
      console.log("Fund tx:", r.hash);
      await refreshFunding();
      alert("Escrow funded.");
    } catch (e) { alert(e.message); } finally { setBusy(false); }
  };

  const doApprove = async () => {
    try {
      setBusy(true);
      if (!isPoster) return alert("Only the poster can approve.");
      if (!isSubmitted) return alert("Task is not in 'submitted'.");
      if (!funded) return alert("Escrow not funded yet. Click 'Fund Escrow' first.");

      const notes = window.prompt("Approval notes (optional):", "");
      // 1) On-chain release (contract -> worker)
      const r = await releaseEscrow(localTask.id);
      // 2) DB: submitted -> completed
      const updated = await approveTask(localTask.id, notes || null);
      // 3) DB: completed -> paid
      const afterPay = await markPaid(updated.id, r.hash);

      setLocalTask(afterPay);
      onChange && onChange(afterPay);
    } catch (e) { alert(e.message); } finally { setBusy(false); }
  };

  const doRequestChanges = async () => {
    try {
      setBusy(true);
      if (!isPoster) return alert("Only the poster can request changes.");
      const notes = window.prompt("What needs to be changed?", localTask.review_notes || "");
      const updated = await requestChanges(localTask.id, notes || null);
      setLocalTask(updated);
      onChange && onChange(updated);
    } catch (e) { alert(e.message); } finally { setBusy(false); }
  };

  const doMarkPaid = async () => {
    try {
      setBusy(true);
      if (!isPoster) return alert("Only the poster can mark paid.");
      const tx = window.prompt("Payout tx hash (optional):", localTask.payout_tx_hash || "");
      const updated = await markPaid(localTask.id, tx || null);
      setLocalTask(updated);
      onChange && onChange(updated);
    } catch (e) { alert(e.message); } finally { setBusy(false); }
  };

  const img = localTask?.image_url || fallback;

  return (
    <div className="bg-[#111827] text-white rounded-lg p-4 shadow">
      <img src={img} alt="task" className="w-full h-40 object-cover rounded mb-4"
           onError={(e) => (e.currentTarget.src = fallback)} />
      <h3 className="font-semibold text-lg">{localTask.title}</h3>
      <p className="text-sm text-gray-300">{localTask.description}</p>

      <div className="mt-3 text-sm space-y-1">
        <div><b>Reward:</b> {localTask.reward} ETH</div>
        <div><b>Location:</b> {localTask.location}</div>
        {localTask.deadline && <div><b>Deadline:</b> {localTask.deadline}</div>}
        <div><b>Status:</b> {localTask.status}</div>

        {isPoster && (isAccepted || isSubmitted) && (
          <div className="text-xs mt-1">
            <b>Escrow:</b> {funded === null ? "…" : funded ? "Funded ✅" : "Not funded ❌"}
          </div>
        )}

        {localTask.worker_wallet && (
          <div className="text-xs text-gray-400 break-all">
            <b>Worker:</b> {localTask.worker_wallet}
          </div>
        )}
        {localTask.submission_url && (
          <div className="text-xs text-gray-300">
            <b>Submission:</b>{" "}
            <a className="underline text-blue-300" href={localTask.submission_url} target="_blank" rel="noreferrer">
              {localTask.submission_url}
            </a>
          </div>
        )}
        {localTask.review_notes && (
          <div className="text-xs text-amber-300 whitespace-pre-wrap">
            <b>Review:</b> {localTask.review_notes}
          </div>
        )}
        {localTask.payout_tx_hash && (
          <div className="text-xs text-green-300">
            <b>Payout:</b>{" "}
            <a className="underline" href={`${etherscanBase}${localTask.payout_tx_hash}`} target="_blank" rel="noreferrer">
              {localTask.payout_tx_hash}
            </a>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {/* Open -> Accept (poster cannot) */}
        {isOpen && !isPoster && (
          <button onClick={doAccept} disabled={!ready || busy}
            className={`rounded-md px-3 py-1.5 text-sm ${ready && !busy ? "bg-white/10 hover:bg-white/20" : "bg-gray-600 cursor-not-allowed"}`}>
            Accept Task
          </button>
        )}

        {/* Accepted -> Submit (only assigned worker) */}
        {isAccepted && !isPoster && (
          <button onClick={doSubmit} disabled={!ready || !isMyAccepted || busy}
            className={`rounded-md px-3 py-1.5 text-sm ${ready && isMyAccepted && !busy ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 cursor-not-allowed"}`}>
            Submit Work
          </button>
        )}

        {/* Poster: fund escrow (visible in accepted/submitted if not funded) */}
        {(isAccepted || isSubmitted) && isPoster && funded === false && (
          <button onClick={doFund} disabled={busy}
            className="rounded-md px-3 py-1.5 text-sm bg-cyan-700 hover:bg-cyan-800">
            Fund Escrow
          </button>
        )}

        {/* Poster review (block if not funded) */}
        {isSubmitted && isPoster && (
          <>
            <button onClick={doApprove} disabled={busy}
              className="rounded-md px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700">
              Approve (Pay)
            </button>
            <button onClick={doRequestChanges} disabled={busy}
              className="rounded-md px-3 py-1.5 text-sm bg-yellow-600 hover:bg-yellow-700">
              Request Changes
            </button>
          </>
        )}

        {/* Fallback manual tx hash */}
        {isCompleted && isPoster && (
          <button onClick={doMarkPaid} disabled={busy}
            className="rounded-md px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700">
            Mark Paid (Manual)
          </button>
        )}

        {isPaid && <span className="text-xs text-green-400 mt-2">Payment complete ✅</span>}
      </div>
    </div>
  );
}
