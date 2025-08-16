import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero({ onStart }) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,rgba(59,130,246,.25),transparent)]" />
      <motion.div
        initial={{ opacity: 0, y: 18 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto max-w-5xl px-6 pt-24 pb-16 text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80">
          New • On-chain escrow
        </span>
        <h1 className="mt-6 text-5xl md:text-6xl font-semibold tracking-tight">
          Micro-freelance, <span className="text-white/70">settled</span> on-chain
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-white/70">
          Post tasks, stake rewards, and release funds trustlessly when work is done.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium hover:bg-blue-700 transition"
          >
            Launch App <ArrowRight size={18} />
          </button>
          <a href="#how" className="rounded-xl border border-white/10 px-5 py-3 text-white/80 hover:bg-white/5 transition">
            How it works
          </a>
        </div>
      </motion.div>
    </div>
  );
} 