"use client";

import { motion } from "framer-motion";
import { Activity, ArrowLeft, LockKeyhole, ServerCog, ShieldCheck, WalletCards, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import type { InvestigationReport } from "@hydrasleuth/shared";
import type { HydraRuntimeStatus } from "@hydrasleuth/magicblock-integration";
import { loadAllReportsFromLocal } from "../lib/report-store";

import { CaseSubmissionForm } from "./case-submission-form";
import { ReportCard } from "./report-card";
import { StatusPill } from "./status-pill";

type HomeDashboardProps = {
  reports: InvestigationReport[];
  network: {
    cluster: string;
    label: string;
    baseRpcUrl: string;
    ephemeralRpcUrl: string;
    validator: string;
    attestedTeeRequired: boolean;
  };
  runtime: HydraRuntimeStatus;
};

const runtimeMetrics = (runtime: HydraRuntimeStatus, reports: InvestigationReport[]) => [
  {
    label: "Anchor program",
    value: runtime.programDeployed ? "Live" : "Blocked",
    icon: ServerCog,
    color: runtime.programDeployed ? "text-neon" : "text-amber-500",
    bg: runtime.programDeployed ? "bg-neon/10 border-neon/20" : "bg-amber-500/10 border-amber-500/20",
  },
  {
    label: "TEE auth",
    value: runtime.teeAuthReady ? "Ready" : "Unavailable",
    icon: ShieldCheck,
    color: runtime.teeAuthReady ? "text-blue-400" : "text-amber-500",
    bg: runtime.teeAuthReady ? "bg-blue-500/10 border-blue-500/20" : "bg-amber-500/10 border-amber-500/20",
  },
  {
    label: "Payments API",
    value: runtime.paymentsApiHealthy ? "Healthy" : "Unavailable",
    icon: WalletCards,
    color: runtime.paymentsApiHealthy ? "text-purple-400" : "text-amber-500",
    bg: runtime.paymentsApiHealthy ? "bg-purple-500/10 border-purple-500/20" : "bg-amber-500/10 border-amber-500/20",
  },
  {
    label: "Settled reports",
    value: String(reports.length),
    icon: Activity,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

export function HomeDashboard({ reports: serverReports, network, runtime }: HomeDashboardProps) {
  const [reports, setReports] = useState<InvestigationReport[]>(serverReports);

  useEffect(() => {
    const localReports = loadAllReportsFromLocal();
    // Merge & deduplicate: local takes priority
    const merged = new Map<string, InvestigationReport>();
    for (const r of serverReports) merged.set(r.caseRecord.caseId, r);
    for (const r of localReports) merged.set(r.caseRecord.caseId, r);
    const all = [...merged.values()].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
    setReports(all);
  }, [serverReports]);

  return (
    <main className="min-h-screen bg-[#050505] relative overflow-hidden text-white">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[5%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neon/10 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[40%] right-[-5%] w-[30%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[30%] rounded-full bg-blue-500/10 blur-[120px] mix-blend-screen" />

      </div>

      <div className="relative z-10 px-6 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-[85rem] space-y-8">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/5 bg-[#0A0A0A]/50 px-6 py-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-5">
              <Link href="/" className="flex items-center justify-center h-10 w-10 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon/20 to-neon/5 border border-neon/20 shadow-[0_0_15px_rgba(34,255,136,0.15)]">
                  <Sparkles className="h-5 w-5 text-neon" />
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight text-white">HydraSleuth App</p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neon/80">
                    Live Dashboard
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusPill label={network.label} tone="neutral" />
              <StatusPill label={network.cluster} tone="good" />
              <StatusPill
                label={runtime.readyForLiveCases ? "Live ready" : "Limited"}
                tone={runtime.readyForLiveCases ? "good" : "warn"}
              />
            </div>
          </motion.header>

          <section className="grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="relative rounded-[2rem] border border-white/10 bg-[#0A0A0A]/80 p-8 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Case dispatch</p>
                  <h1 className="mt-2 text-4xl font-display font-bold tracking-tight text-white md:text-5xl">
                    Open Investigation
                  </h1>
                  <p className="mt-4 max-w-xl text-white/60 font-light leading-relaxed">
                    Submit a wallet, token, or program target. HydraSleuth will open a private session, run specialists, reward useful work, and settle a secure report.
                  </p>
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-neon/20 via-white/5 to-transparent my-8" />

              <div>
                <CaseSubmissionForm
                  networkLabel={network.label}
                  cluster={network.cluster}
                  liveReady={runtime.readyForLiveCases}
                  readinessSummary={runtime.blockers[0]}
                />
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="space-y-8"
            >
              <section className="rounded-[2rem] border border-white/10 bg-[#0A0A0A]/80 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon/5 rounded-full blur-[50px]" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neon/20 bg-neon/10">
                    <LockKeyhole className="h-5 w-5 text-neon" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Runtime status</p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-white">
                      Working System Checks
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 relative z-10">
                  {runtimeMetrics(runtime, reports).map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${item.bg} mb-3`}>
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <p className="text-xs font-medium text-white/50">{item.label}</p>
                      <p className="mt-1 text-lg font-bold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="relative z-10 mt-6">
                  {runtime.blockers.length > 0 ? (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-500">
                      <span className="text-sm font-medium">{runtime.blockers[0]}</span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-neon/20 bg-neon/10 p-4 text-neon flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-medium">
                        Live case execution is available on this runtime path.
                      </span>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-[#0A0A0A]/80 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[50px]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 relative z-10">Network route</p>
                <div className="mt-5 space-y-4 relative z-10">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-xs font-medium text-white/50">Base layer</p>
                    <p className="mt-1 break-all text-sm font-mono text-white/80">
                      {network.baseRpcUrl}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-xs font-medium text-white/50">Private execution</p>
                    <p className="mt-1 break-all text-sm font-mono text-white/80">
                      {network.ephemeralRpcUrl}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    <p className="text-xs font-medium text-white/50">Validator</p>
                    <p className="mt-1 break-all text-sm font-mono text-white/80">
                      {network.validator}
                    </p>
                  </div>
                </div>
              </section>
            </motion.aside>
          </section>

          <section className="space-y-8 pt-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Settled reports</p>
                <h2 className="mt-2 text-3xl font-display font-bold tracking-tight text-white">
                  Public Outcomes
                </h2>
              </div>
              <StatusPill label={`${reports.length} reports`} tone="neutral" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {reports.length > 0 ? (
                reports.map((report, index) => (
                  <motion.div
                    key={report.caseRecord.caseId}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 * index }}
                  >
                    <ReportCard report={report} />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 rounded-[2rem] border border-white/10 bg-[#0A0A0A]/80 p-12 text-center shadow-2xl backdrop-blur-xl">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.02] border border-white/5 mb-6">
                    <Activity className="h-8 w-8 text-white/20" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No settled cases yet</h3>
                  <p className="text-sm leading-relaxed text-white/50 max-w-md mx-auto">
                    Launch the first live investigation to populate the app
                    with reports, handoffs, and private payment traces.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
