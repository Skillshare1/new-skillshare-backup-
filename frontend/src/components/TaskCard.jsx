// src/components/TaskCard.jsx
import React from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  acceptTask,
  submitWork,
  approveTask,
  requestChanges,
} from "../lib/taskService";
import { fundEscrow, releaseEscrow } from "../lib/escrow";
import BackgroundGradient from "./ui/BackgroundGradient";

const explorerBase =
  import.meta.env.VITE_EXPLORER_TX_BASE ||
  (Number(import.meta.env.VITE_CHAIN_ID) === 747
    ? "https://evm.flowscan.io/tx/"
    : "https://sepolia.etherscan.io/tx/");
const fallback = "/defaultimg.png";

export default function TaskCard({ task, onChange }) {
  const { authenticated, login } = usePrivy();

  const doAccept = async () => {
    if (!authenticated) return login();
    await acceptTask(task.id);
    onChange?.();
  };

  const doSubmit = async () => {
    const url = prompt("Submission URL (repo/demo):");
    const notes = prompt("Notes (optional):") || "";
    if (!url) return;
    await submitWork(task.id, { url, notes });
    onChange?.();
  };

  const doApprove = async () => {
    await approveTask(task.id);
    onChange?.();
  };

  const doRequestChanges = async () => {
    const reason = prompt("What needs to change?");
    if (!reason) return;
    await requestChanges(task.id, reason);
    onChange?.();
  };

  const doFund = async () => {
    const amount = prompt("Stake amount in ETH (e.g., 0.01):", task?.reward || "");
    if (!amount) return;
    const tx = await fundEscrow(task.id, amount);
    console.log("funded:", tx.hash);
    onChange?.();
  };

  const doRelease = async () => {
    const tx = await releaseEscrow(task.id);
    console.log("released:", tx.hash);
    onChange?.();
  };

  return (
    <BackgroundGradient className="rounded-2xl">
      <div className="rounded-2xl p-5 sm:p-6 lg:p-7 text-white">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold">
              {task?.title || "Untitled Task"}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-zinc-300">
              {task?.category || "General"} · Reward:{" "}
              <span className="font-medium">{task?.reward ?? "—"} ETH</span>
            </p>
          </div>
          <span
            className={
              (task?.status === "funded"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-zinc-700/30 text-zinc-300") +
              " rounded-full px-3 py-1 text-xs border border-white/10"
            }
          >
            {task?.status || "pending"}
          </span>
        </div>

        {/* image */}
        <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-white/10">
          <img
            src={task?.image_url || fallback}
            alt={task?.title || "task"}
            className="h-44 w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* description */}
        <p className="mt-4 text-sm text-zinc-300 line-clamp-4">
          {task?.description || "No description provided."}
        </p>

        {/* meta */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] text-zinc-300">
          <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
            <div className="text-xs text-zinc-400">Deadline</div>
            <div>{task?.deadline ? new Date(task.deadline).toLocaleString() : "—"}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
            <div className="text-xs text-zinc-400">Poster</div>
            <div className="truncate">{task?.wallet || "—"}</div>
          </div>
        </div>

        {/* actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {task?.status === "open" && (
            <button
              className="rounded-lg bg-indigo-500/90 px-4 py-2 text-sm font-medium hover:bg-indigo-500 ring-1 ring-white/10"
              onClick={doAccept}
            >
              Accept
            </button>
          )}
          {(task?.status === "accepted" || task?.status === "changes_requested") && (
            <button
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium hover:bg-zinc-700 ring-1 ring-white/10"
              onClick={doSubmit}
            >
              Submit Work
            </button>
          )}
          {task?.status === "submitted" && (
            <>
              <button
                className="rounded-lg bg-emerald-500/90 px-4 py-2 text-sm font-medium hover:bg-emerald-500 ring-1 ring-white/10"
                onClick={doApprove}
              >
                Approve
              </button>
              <button
                className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium hover:bg-zinc-700 ring-1 ring-white/10"
                onClick={doRequestChanges}
              >
                Request Changes
              </button>
            </>
          )}
          {task?.status === "approved" && (
            <>
              <button
                className="rounded-lg bg-fuchsia-500/90 px-4 py-2 text-sm font-medium hover:bg-fuchsia-500 ring-1 ring-white/10"
                onClick={doFund}
              >
                Fund Escrow
              </button>
              <button
                className="rounded-lg bg-sky-500/90 px-4 py-2 text-sm font-medium hover:bg-sky-500 ring-1 ring-white/10"
                onClick={doRelease}
              >
                Release
              </button>
            </>
          )}

          {task?.tx_hash && (
            <a
              href={`${explorerBase}${task.tx_hash}`}
              target="_blank"
              rel="noreferrer"
              className="ml-auto text-xs underline decoration-dotted text-zinc-300 hover:text-white"
            >
              View Tx
            </a>
          )}
        </div>
      </div>
    </BackgroundGradient>
  );
}
