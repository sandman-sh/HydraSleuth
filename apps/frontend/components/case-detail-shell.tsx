"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Coins, FileLock2, Orbit, ScanSearch, ShieldCheck, Printer } from "lucide-react";
import Link from "next/link";

import type { InvestigationReport } from "@hydrasleuth/shared";

import { StatusPill } from "./status-pill";
import { CaseCharts } from "./case-charts";

function toneFromVerdict(verdict: InvestigationReport["verdict"]) {
  if (verdict === "critical") return "critical";
  if (verdict === "elevated") return "warn";
  if (verdict === "low") return "good";
  return "neutral";
}

export function CaseDetailShell({ report }: { report: InvestigationReport }) {
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
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between print:hidden">
            <Link href="/app" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-4 py-2 text-sm font-medium text-neon hover:bg-neon/20 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Export PDF
            </button>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-[2rem] border border-white/10 bg-[#0A0A0A]/80 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 rounded-full blur-[80px]" />
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-4xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{report.caseRecord.investigationType}</p>
                <h1 className="mt-2 text-4xl font-display font-bold tracking-tight text-white md:text-5xl">
                  {report.caseRecord.subject}
                </h1>
                <p className="mt-4 max-w-4xl text-base leading-relaxed text-white/70 font-light">
                  {report.leadSummary}
                </p>
              </div>
              <StatusPill label={report.verdict} tone={toneFromVerdict(report.verdict)} />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4 relative z-10">
              {[
                { icon: ShieldCheck, label: "Risk", value: `${report.riskScore}/100`, color: "text-red-400" },
                { icon: Orbit, label: "Private handoffs", value: String(report.privateHandoffs.length), color: "text-blue-400" },
                { icon: Coins, label: "Micropayments", value: String(report.privateMicropayments.length), color: "text-purple-400" },
                { icon: FileLock2, label: "Attestation", value: `${report.attestationHash.slice(0, 12)}...`, color: "text-neon" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-4 ${metric.color}`}>
                    <metric.icon className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{metric.label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <section className="grid gap-8 xl:grid-cols-[1.06fr,0.94fr]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.08 }}
              className="space-y-8"
            >
              <section className="rounded-[2rem] border border-white/10 bg-[#0A0A0A]/80 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon/5 rounded-full blur-[50px]" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neon/20 bg-neon/10">
                    <ScanSearch className="h-5 w-5 text-neon" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Public settlement</p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-white">
                      Sanitized L1 Report
                    </h2>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-relaxed text-white/70 relative z-10">{report.sanitizedSummary}</p>

                <div className="mt-6 space-y-4 relative z-10">
                  <div className="rounded-2xl border border-white/5 bg-[#111]/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Settlement call</p>
                    <p className="mt-1 font-mono text-xs text-white/80">
                      {report.settlementPlan.baseLayerInstruction}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-[#111]/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Report PDA seed</p>
                    <p className="mt-1 break-all text-xs font-mono text-white/80">
                      {report.settlementPlan.reportPdaSeed}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-[#111]/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Session URI</p>
                    <p className="mt-1 break-all text-xs font-mono text-white/80">
                      {report.settlementPlan.privateSessionUri}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-[#0A0A0A]/80 p-8 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Swarm Intelligence Map</p>
                  <p className="text-[10px] uppercase tracking-widest text-neon/70">Severity vs Impact</p>
                </div>
                <CaseCharts report={report} />
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-[#0A0A0A]/80 p-8 shadow-2xl backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-5">Agent Findings</p>
                <div className="grid gap-5">
                  {report.contributions.map((contribution, index) => (
                    <motion.article
                      key={contribution.taskId}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.12 + index * 0.06 }}
                      className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neon flex items-center justify-between">
                        <span>{contribution.agent}</span>
                        <span className="text-white/40">Confidence: {(contribution.confidence * 100).toFixed(0)}%</span>
                      </p>
                      <h3 className="mt-2 text-lg font-bold tracking-tight text-white">
                        {contribution.headline}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/60">{contribution.summary}</p>
                      
                      {contribution.signals && contribution.signals.length > 0 && (
                        <div className="mt-5 space-y-3">
                          <div className="h-px w-full bg-white/5" />
                          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Forensic Evidence Signals</p>
                          <div className="grid gap-3">
                            {contribution.signals.map((signal, sIdx) => (
                              <div key={sIdx} className="rounded-xl border border-white/5 bg-[#111] p-4 flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${
                                      signal.severity === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                      signal.severity === 'medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                      'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                    }`} />
                                    <span className="text-xs font-bold text-white">{signal.label}</span>
                                  </div>
                                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                    signal.severity === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    signal.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    {signal.severity}
                                  </span>
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed pl-4 border-l border-white/5 ml-1">
                                  {signal.evidence}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {contribution.sourceTags && contribution.sourceTags.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {contribution.sourceTags.map((tag) => (
                            <span key={tag} className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-medium text-white/40">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.article>
                  ))}
                </div>
              </section>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.12 }}
              className="space-y-8"
            >
              <section className="rounded-[2rem] border border-white/10 bg-[#0A0A0A]/80 p-8 shadow-2xl backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-5">Private Rollup Log</p>
                <div className="space-y-4">
                  {report.coordinationLog.map((event, idx) => (
                    <div key={`${event?.type ?? "event"}-${idx}`} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neon">{event?.type ?? "log"}</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/70">{event?.detail ?? String(event)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-[#0A0A0A]/80 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[50px]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-5 relative z-10">Private Micropayments</p>
                <div className="space-y-4 relative z-10">
                  {report.privateMicropayments.map((payment, idx) => (
                    <div key={`${payment.to ?? "agent"}-${idx}`} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-xs font-mono font-semibold text-white truncate">{payment.to ?? "Unknown Agent"}</p>
                        <StatusPill label={payment.status ?? "submitted"} tone="good" />
                      </div>
                      <p className="text-sm leading-relaxed text-white/70">
                        <strong className="text-neon">{(payment.amount ?? 0).toLocaleString()} units</strong> through the {payment.route ?? "ephemeral"} route as a {payment.visibility ?? "private"} transfer.
                      </p>
                      <div className="mt-3 rounded-lg bg-[#111] border border-white/5 p-3">
                        <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Signature</p>
                        <p className="break-all text-xs font-mono text-white/60">
                          {payment.transactionSignature ?? "pending"}
                        </p>
                        <p className="mt-2 break-all font-mono text-[10px] leading-relaxed text-white/30">
                          {(payment.transactionBase64 ?? "").slice(0, 80)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          </section>
        </div>
      </div>
    </main>
  );
}
