"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Cpu, ShieldCheck, Zap, LockKeyhole, Network, WalletCards, Server, CheckCircle2, Bot, Search, Activity, Image as ImageIcon } from "lucide-react";

const sections = [
  { id: "introduction", title: "Introduction" },
  { id: "architecture", title: "Architecture" },
  { id: "agents", title: "Agent Swarm" },
  { id: "magicblock", title: "MagicBlock PER" },
  { id: "getting-started", title: "Getting Started" },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-neon/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]" />

      </div>

      <div className="relative z-10 flex flex-col md:flex-row max-w-[90rem] mx-auto min-h-screen">
        {/* Sidebar */}
        <aside className="w-full md:w-72 shrink-0 border-r border-white/10 bg-[#0A0A0A]/50 backdrop-blur-xl p-6 md:sticky top-0 md:h-screen overflow-y-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-10 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon/10 border border-neon/20">
              <BookOpen className="h-4 w-4 text-neon" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Documentation</h1>
          </div>

          <nav className="space-y-1">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 px-6 py-12 md:px-16 lg:px-24 md:py-20 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl space-y-20 pb-32"
          >
            {/* Introduction */}
            <section id="introduction" className="space-y-6 scroll-mt-24">
              <div>
                <h2 className="text-4xl font-display font-bold tracking-tight text-white mb-4">HydraSleuth Overview</h2>
                <p className="text-lg text-white/70 leading-relaxed font-light">
                  HydraSleuth is a private multi-agent detective swarm for Solana investigations, designed around MagicBlock Private Ephemeral Rollups (PER) and private agent-to-agent incentives.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6 mt-8">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-lg">
                  <LockKeyhole className="h-6 w-6 text-emerald-400 mb-4" />
                  <h3 className="font-semibold text-white mb-2">Private Execution</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Case coordination is modeled as a PrivateRollupSession. Internal reasoning and handoffs remain completely hidden from the public ledger.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-lg">
                  <WalletCards className="h-6 w-6 text-purple-400 mb-4" />
                  <h3 className="font-semibold text-white mb-2">Micropayments</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Useful contributions from specialized agents earn private SPL micropayments seamlessly integrated with MagicBlock Payments API.
                  </p>
                </div>
              </div>
            </section>

            {/* Architecture */}
            <section id="architecture" className="space-y-6 scroll-mt-24">
              <h2 className="text-3xl font-display font-bold tracking-tight text-white border-b border-white/10 pb-4">System Architecture</h2>
              <p className="text-white/70 leading-relaxed font-light mb-8">
                The platform is separated into distinct operational layers to ensure scalability, privacy, and verifiability.
              </p>

              <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-6 before:w-px before:bg-gradient-to-b before:from-neon/50 before:via-white/10 before:to-transparent">
                <div className="relative pl-16">
                  <div className="absolute left-0 top-1 flex h-12 w-12 items-center justify-center rounded-xl border border-neon/20 bg-[#0A0A0A] shadow-[0_0_15px_rgba(34,255,136,0.1)]">
                    <Server className="h-5 w-5 text-neon" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">1. Solana L1 Entrypoint</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    The <code className="text-neon/80 bg-neon/10 px-1.5 py-0.5 rounded text-xs">programs/hydra_sleuth</code> Anchor program handles treasury initialization, case submission, state delegation, and final settlement. Treasury and case records are stored as PDAs to maintain a verifiable L1 audit trail.
                  </p>
                </div>

                <div className="relative pl-16">
                  <div className="absolute left-0 top-1 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-[#0A0A0A] shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <ShieldCheck className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">2. MagicBlock Private Layer</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Provides dual base-layer and ephemeral connections. Handles AES-GCM encrypted handoffs and builds private transactions against the live <code className="text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">payments.magicblock.app</code> infrastructure.
                  </p>
                </div>

                <div className="relative pl-16">
                  <div className="absolute left-0 top-1 flex h-12 w-12 items-center justify-center rounded-xl border border-purple-500/20 bg-[#0A0A0A] shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                    <Network className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">3. Agent Swarm</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    A collection of highly specialized TypeScript agents that analyze data from Helius RPCs, Metaplex, and native Solana nodes to synthesize a cohesive risk assessment.
                  </p>
                </div>
              </div>
            </section>

            {/* Agent Swarm */}
            <section id="agents" className="space-y-6 scroll-mt-24">
              <h2 className="text-3xl font-display font-bold tracking-tight text-white border-b border-white/10 pb-4">The Agent Swarm</h2>
              <p className="text-white/70 leading-relaxed font-light mb-8">
                HydraSleuth relies on a specialized team of autonomous agents, each built to analyze specific risk vectors on the Solana network. They collaborate via encrypted messaging within the MagicBlock PER environment.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Bot className="w-32 h-32 text-neon" />
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon/10 border border-neon/20 mb-4 text-neon">
                    <Bot className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">Lead Investigator</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    The orchestrator of the swarm. It receives the initial case, breaks it down into sub-tasks, dispatches work to specialized agents, and ultimately compiles the final sanitized risk report for L1 settlement.
                  </p>
                </div>

                <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Activity className="w-32 h-32 text-blue-400" />
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4 text-blue-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">Flow Tracer</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Utilizes Helius-style RPC flow checks to deeply analyze transaction history. It traces the origin of funds, detects wash trading loops, and uncovers hidden financial relationships between wallets.
                  </p>
                </div>

                <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ImageIcon className="w-32 h-32 text-purple-400" />
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 mb-4 text-purple-400">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">Metadata Sleuth</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Integrates with Metaplex JS to pull and analyze token and NFT metadata. It flags suspicious immutable properties, missing creator signatures, and deceptive URI structures.
                  </p>
                </div>

                <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Search className="w-32 h-32 text-emerald-400" />
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4 text-emerald-400">
                    <Search className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">Pattern Detector</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    The anomaly hunter. It reviews the raw data collected by other agents and identifies known malicious patterns, such as rug-pull indicators or program exploit signatures.
                  </p>
                </div>
              </div>
            </section>

            {/* MagicBlock PER */}
            <section id="magicblock" className="space-y-6 scroll-mt-24">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111] to-[#0A0A0A] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 rounded-full blur-[80px]" />
                <h2 className="text-2xl font-display font-bold tracking-tight text-white mb-4 relative z-10">MagicBlock Integration Deep Dive</h2>
                <p className="text-white/70 leading-relaxed font-light mb-6 relative z-10">
                  Unlike typical integrations, MagicBlock is the core of HydraSleuth's architecture:
                </p>
                <ul className="space-y-4 relative z-10">
                  {[
                    "Case coordination is modeled as a PrivateRollupSession.",
                    "Agent-to-agent handoffs are encrypted and logged as PER coordination events.",
                    "Micropayments utilize MagicBlock Private Payments API semantics.",
                    "The settlement path explicitly returns to Solana L1 after private execution.",
                    "Anchor program includes hooks for MagicBlock Ephemeral Rollups."
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-neon shrink-0 mt-0.5" />
                      <span className="text-sm text-white/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Getting Started */}
            <section id="getting-started" className="space-y-6 scroll-mt-24">
              <h2 className="text-3xl font-display font-bold tracking-tight text-white border-b border-white/10 pb-4">Getting Started</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">1. Environment Setup</h3>
                  <p className="text-white/60 text-sm mb-4">Copy the example environment file and configure your RPCs.</p>
                  <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 overflow-x-auto">
                    <pre className="text-sm font-mono text-white/80"><code>cp .env.example .env.local</code></pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-3">2. Installation</h3>
                  <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 overflow-x-auto">
                    <pre className="text-sm font-mono text-white/80"><code>npm install</code></pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-3">3. Run Development Server</h3>
                  <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 overflow-x-auto">
                    <pre className="text-sm font-mono text-white/80"><code>npm run dev</code></pre>
                  </div>
                  <p className="text-white/60 text-sm mt-3">The application will be available at <code className="text-neon">http://localhost:3000</code>.</p>
                </div>
              </div>
            </section>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
