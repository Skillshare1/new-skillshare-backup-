import { ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import LightRays from "../components/Backgrounds/LightRays";
import SearchGlow from "../components/ui/SearchGlow";
import GlassCard from "../components/ui/GlassCard";
import NeonButton from "../components/ui/NeonButton";
import { ThreeDMarquee } from "../components/ui/3d-marquee";

const demoImages = [
  // Adding some more images to make it fuller
  "/1.png",
  "/2.png", 
  "/3.png",
  "/4.png",
  "/5.png",
  "/1.png",
  "/2.png",
  "/3.png",
  "/4.png",
  "/5.png",
  "/1.png",
  "/3.png",
  "/2.png",
  "/4.png",
  "/5.png",
  "/1.png",
  "/3.png",
  "/4.png",
  "/2.png",
  "/5.png",
  "/2.png",
  "/4.png",
  "/1.png",
  "/5.png",
  "/3.png",
  "/4.png",
  "/1.png",
  "/2.png",
];

export default function Landing({ onLaunch, onConnect }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-black">
      <Navbar onConnect={onConnect} />

      {/* Hero Section */}
      <main className="relative mx-auto max-w-5xl px-6 pt-36 pb-28 text-center">
        {/* Light Rays background only for Hero */}
        <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.95] mix-blend-screen">
          <LightRays
            raysOrigin="top-center"
            raysColor="#7c3aed"
            raysSpeed={1.25}
            lightSpread={0.9}
            rayLength={1.5}
            followMouse
            mouseInfluence={0.12}
            noiseAmount={0.06}
            distortion={0.03}
            saturation={1.35}
          />
        </div>

        {/* Hero content */}
        <div className="relative z-[2]">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10
                          bg-white/5 px-3 py-1 text-xs text-white/70">
            <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
            New · On-chain escrow
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
            Developers Dojo
          </h1>
          <h2 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-white/70">
            Micro-freelance, <span className="text-white/50">settled</span> on-chain
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-white/70">
            Post tasks, stake rewards, and release funds trustlessly when work is done.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={onLaunch}
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white
                        hover:bg-indigo-500 transition-colors"
            >
              Launch App →
            </button>
            <a
              href="#how"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium
                        text-white/80 hover:bg-white/10 transition-colors"
            >
              How it works
            </a>
          </div>

          {/* 3D MARQUEE */}
          <div className="mt-16">
            <ThreeDMarquee images={demoImages} />
          </div>
        </div>
      </main>

      {/* Minimal features row */}
      <section id="how" className="mx-auto mb-24 max-w-6xl px-6 relative z-[2]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Trustless Escrow", "Funds locked in smart contracts until verified."],
            ["Instant Settlements", "On-chain releases when tasks complete."],
            ["Location-Based", "Browse tasks on an interactive map."],
            ["Crypto Payments", "Pay in ETH / stablecoins."],
          ].map(([title, body]) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left
                          shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] hover:bg-white/[0.06]
                          transition-colors"
            >
              <h3 className="text-white font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-white/70">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
