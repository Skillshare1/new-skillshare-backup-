"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function ThreeDCard({ className = "", children }) {
  return (
    <motion.div
      className={cn(
        "relative rounded-2xl transition-transform duration-200 will-change-transform",
        className
      )}
      style={{ transformStyle: "preserve-3d" }}
      whileHover={{ rotateX: -6, rotateY: 6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
    >
      {/* subtle spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "radial-gradient(400px 200px at 20% 0%, rgba(255,255,255,0.12), transparent 50%)",
          transform: "translateZ(40px)",
        }}
      />
      <div style={{ transform: "translateZ(60px)" }} className="relative">
        {children}
      </div>
    </motion.div>
  );
}
