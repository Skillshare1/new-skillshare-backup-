// src/components/Navbar.jsx
import React from "react";
import { usePrivy } from "@privy-io/react-auth";

/**
 * Glassy, whitish navbar (your original look), with Privy login + linkWallet.
 * Props:
 *   onPostClick?: () => void
 */
export default function Navbar({ onPostClick }) {
  const { ready, authenticated, user, login, logout, linkWallet } = usePrivy();

  const short = (addr) =>
    addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : "";

  const walletAddr = user?.wallet?.address || null;

  const onConnectClick = async () => {
    if (!ready) return;
    if (!authenticated) {
      await login();
      return;
    }
    if (!walletAddr) {
      try {
        await linkWallet(); // prompts MetaMask (or selected wallet)
      } catch (e) {
        console.error("linkWallet error:", e);
        alert("Couldn’t link your wallet. Try again.");
      }
    }
  };

  return (
    // fixed, centered, whitish glass container (your original styles)
    <div className="pointer-events-none fixed left-0 right-0 top-10 z-50 flex justify-center">
      <nav
        className="
          pointer-events-auto
          relative mx-auto flex w-[92%] max-w-5xl items-center justify-between
          rounded-2xl border border-white/20
          bg-white/10 backdrop-blur-xl
          px-4 py-2 sm:px-6
          shadow-[0_10px_40px_-10px_rgba(0,0,0,0.45)]
        "
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/90 ring-8 ring-violet-500/10" />
        <span className="text-sm font-semibold tracking-wide text-white/90">SkillSnap</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {authenticated && (
            <button
              onClick={onPostClick}
              className="
                hidden sm:inline-flex
                rounded-xl border border-white/20 bg-white/10 px-3 py-1.5
                text-xs font-medium text-white/90
                hover:bg-white/20 transition-colors
              "
            >
              Post Task
            </button>
          )}

          {/* Connect / Link / Connected */}
          <button
            onClick={onConnectClick}
            disabled={!ready}
            className="
              group relative inline-flex items-center
              rounded-2xl px-[0.15rem] py-[0.15rem]
              bg-gradient-to-r from-violet-500 to-indigo-500
              disabled:opacity-60
            "
            aria-label="Connect / Link wallet"
            title={
              !ready
                ? "Loading…"
                : authenticated
                ? walletAddr
                  ? "Connected"
                  : "Link your wallet"
                : "Connect with Privy"
            }
          >
            <span
              className="
                inline-flex items-center gap-2 rounded-2xl
                border border-white/20 bg-white/10 backdrop-blur-xl
                px-4 py-1.5 text-xs font-medium text-white/90
                hover:bg-white/20 transition-colors
              "
            >
              {!ready
                ? "..."
                : authenticated
                ? walletAddr
                  ? `${short(walletAddr)} Connected`
                  : "Link Wallet"
                : "Connect Wallet"}
            </span>
          </button>

          {authenticated && (
            <button
              onClick={logout}
              className="
                text-xs px-2 py-1 rounded bg-white/10 text-white/90 hover:bg-white/20
              "
              title="Logout"
            >
              Logout
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
