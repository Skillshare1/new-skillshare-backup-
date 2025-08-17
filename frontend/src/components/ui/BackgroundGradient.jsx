import React from "react";
import { cn } from "@/lib/utils";

export default function BackgroundGradient({ className = "", children }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-[1px] overflow-hidden",
        "bg-[radial-gradient(1200px_600px_at_10%_-20%,rgba(99,102,241,0.35),transparent),radial-gradient(800px_400px_at_110%_10%,rgba(56,189,248,0.35),transparent),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]",
        "backdrop-blur-sm",
        className
      )}
    >
      <div className="rounded-2xl bg-black/80">{children}</div>
    </div>
  );
}
