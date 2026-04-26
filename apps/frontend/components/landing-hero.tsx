"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, LockKeyhole, Radar, ShieldCheck, WalletCards, Sparkles, ChevronRight, Cpu, Zap, Network } from "lucide-react";
import { useRef } from "react";

const productSignals = [
  {
    title: "Private Coordination",
    body: "Cases open inside MagicBlock Private Ephemeral Rollups so agents can collaborate without exposing raw internal reasoning on-chain.",
    icon: LockKeyhole,
    color: "from-emerald-400/20 to-teal-500/20",
    iconColor: "text-emerald-400"
  },
  {
    title: "Specialist Execution",
    body: "Lead, flow, metadata, and anomaly agents split the work, exchange encrypted handoffs, and converge on a single outcome.",
    icon: Network,
    color: "from-blue-400/20 to-cyan-500/20",
    iconColor: "text-blue-400"
  },
  {
    title: "Private Incentives",
    body: "Useful contributions earn private micropayments before a sanitized report settles back to Solana L1.",
    icon: WalletCards,
    color: "from-purple-400/20 to-fuchsia-500/20",
    iconColor: "text-purple-400"
  },
];

const proofStrip = [
  { label: "MagicBlock execution", icon: Cpu },
  { label: "Helius flow checks", icon: Zap },
  { label: "Metaplex review", icon: Radar },
  { label: "Solana L1 settlement", icon: ShieldCheck },
];

export function LandingHero() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <main ref={containerRef} className="immersive-shell min-h-screen relative overflow-hidden bg-[#050505]">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neon/10 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[30%] rounded-full bg-purple-500/10 blur-[120px] mix-blend-screen" />

      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505] pointer-events-none z-0" />

      <section className="relative z-10 mx-auto max-w-[85rem] px-6 py-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between rounded-full border border-white/5 bg-white/[0.02] px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon/20 to-neon/5 border border-neon/20 shadow-[0_0_15px_rgba(34,255,136,0.15)]">
              <Sparkles className="h-5 w-5 text-neon" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">HydraSleuth</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neon/80">Private Investigations</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/60">
            <Link href="/docs#agents" className="hover:text-white transition-colors">Features</Link>
            <Link href="/docs#magicblock" className="hover:text-white transition-colors">How it works</Link>
            <Link href="/docs#architecture" className="hover:text-white transition-colors">Architecture</Link>
          </div>
          <div>
            <Link href="/app" className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-neutral-200 hover:scale-105 active:scale-95">
              Launch App
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.header>

        <section className="grid min-h-[calc(100vh-8rem)] items-center gap-12 py-16 lg:grid-cols-[1.1fr,0.9fr] lg:gap-16">
          <motion.div
            style={{ y, opacity }}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start gap-8"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-4 py-2 shadow-[0_0_20px_rgba(34,255,136,0.1)] backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neon"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide text-neon">Solana L1 Mainnet Beta Ready</span>
            </motion.div>

            <div className="space-y-6">
              <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-[5.5rem]">
                Decentralized <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon via-emerald-400 to-cyan-400">
                  Agentic Forensics
                </span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-white/70 md:text-xl font-light">
                Open a case, route it through private agent execution, reward useful work privately, and settle only the risk outcome to Solana L1. The future of confidential on-chain analysis.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <Link href="/app" className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-neon px-8 py-4 text-base font-bold text-black shadow-[0_0_30px_rgba(34,255,136,0.3)] transition-all hover:shadow-[0_0_40px_rgba(34,255,136,0.5)] hover:scale-105 active:scale-95">
                Start Investigation
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/docs" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10">
                Read the Docs
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 pt-4 border-t border-white/10 mt-2 w-full">
              {proofStrip.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                  className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2"
                >
                  <item.icon className="h-4 w-4 text-white/50" />
                  <span className="text-xs font-medium text-white/70">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-b from-neon/20 to-purple-500/20 opacity-50 blur-xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-[#0A0A0A]/80 p-8 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Architecture overview</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                    Private Agent Workflow
                  </h2>
                </div>
                <div className="rounded-full border border-neon/20 bg-neon/10 px-3 py-1 text-xs font-semibold text-neon shadow-[0_0_10px_rgba(34,255,136,0.1)]">
                  Live Network
                </div>
              </div>

              <div className="space-y-4">
                {productSignals.map((item, index) => (
                  <motion.article
                    key={item.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.04] hover:border-white/10"
                  >
                    <div className={`absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l ${item.color} opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-xl`} />
                    <div className="relative z-10 flex gap-5">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#111] shadow-inner ${item.iconColor}`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">{item.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-white/60 font-light">{item.body}</p>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-white/5 bg-[#111]/50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5">
                    <ShieldCheck className="h-5 w-5 text-white/80" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Enterprise-grade security</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">
                      Zero-knowledge proofs and ephemeral rollups ensure that your investigation logic and intermediate states remain completely confidential.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </section>
    </main>
  );
}
