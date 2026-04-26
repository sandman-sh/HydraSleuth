"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ShieldAlert, Sparkles, Activity } from "lucide-react";
import Link from "next/link";

import type { InvestigationReport } from "@hydrasleuth/shared";

import { ReportSummary } from "./report-summary";
import { StatusPill } from "./status-pill";

function toneFromVerdict(verdict: InvestigationReport["verdict"]) {
  switch (verdict) {
    case "critical":
      return "critical";
    case "elevated":
      return "warn";
    case "guarded":
      return "neutral";
    default:
      return "good";
  }
}

function colorFromVerdict(verdict: InvestigationReport["verdict"]) {
  switch (verdict) {
    case "critical":
      return "border-red-500/20 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
    case "elevated":
      return "border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]";
    case "guarded":
      return "border-blue-500/20 bg-blue-500/10 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]";
    default:
      return "border-neon/20 bg-neon/10 text-neon shadow-[0_0_15px_rgba(34,255,136,0.1)]";
  }
}

export function ReportCard({ report }: { report: InvestigationReport }) {
  const verdictStyle = colorFromVerdict(report.verdict);
  
  return (
    <motion.div whileHover={{ y: -6, scale: 1.01 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
      <Link href={`/cases/${report.caseRecord.caseId}`} className="block group">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0A0A0A]/80 p-8 shadow-2xl backdrop-blur-xl transition-colors group-hover:bg-[#111]/90 group-hover:border-white/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{report.caseRecord.targetKind} case</p>
              <h3 className="mt-2 text-2xl font-display font-bold tracking-tight text-white group-hover:text-neon transition-colors">
                {report.caseRecord.subject.slice(0, 16)}...{report.caseRecord.subject.slice(-4)}
              </h3>
              <p className="mt-1 text-sm font-medium text-white/60">{report.caseRecord.investigationType}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${verdictStyle}`}>
                {report.verdict}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-all group-hover:bg-neon group-hover:text-black group-hover:border-neon group-hover:shadow-[0_0_15px_rgba(34,255,136,0.4)]">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent my-6 relative z-10" />
          
          <div className="relative z-10 text-white/70">
            <ReportSummary summary={report.sanitizedSummary} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3 relative z-10">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors group-hover:bg-white/[0.04]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Risk score</p>
              <p className="mt-2 flex items-center gap-2 text-xl font-bold text-white">
                <ShieldAlert className="h-5 w-5 text-red-400" />
                {report.riskScore}<span className="text-sm font-medium text-white/40">/100</span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors group-hover:bg-white/[0.04]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Private Hops</p>
              <p className="mt-2 flex items-center gap-2 text-xl font-bold text-white">
                <Activity className="h-5 w-5 text-blue-400" />
                {report.privateHandoffs.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors group-hover:bg-white/[0.04]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Rewards</p>
              <p className="mt-2 flex items-center gap-2 text-xl font-bold text-white">
                <Sparkles className="h-5 w-5 text-purple-400" />
                {report.privateMicropayments.length}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
