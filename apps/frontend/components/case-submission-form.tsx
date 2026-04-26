"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, LoaderCircle, Zap, ShieldCheck, LockKeyhole, AlertCircle, ArrowRight, Shield, Search, Terminal, Cpu, Network, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState, useEffect } from "react";
import { createPortal } from "react-dom";

import type { InvestigationTargetKind, InvestigationReport } from "@hydrasleuth/shared";
import { saveReportToLocal } from "../lib/report-store";

const kinds: InvestigationTargetKind[] = ["wallet", "token", "program"];

const quickPrompts = [
  "Investigate possible wash trading",
  "Analyze for rug-pull risk",
  "Check for suspicious PDA behavior",
];

export function CaseSubmissionForm({
  networkLabel,
  cluster,
  liveReady,
  readinessSummary,
}: {
  networkLabel: string;
  cluster: string;
  liveReady: boolean;
  readinessSummary?: string;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [targetKind, setTargetKind] = useState<InvestigationTargetKind>("wallet");
  const [investigationType, setInvestigationType] = useState("Investigate possible wash trading");
  const [context, setContext] = useState(
    "Look for circular flow, mint authority risk, and any signs of coordinated activity.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const response = await fetch("/api/cases", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        subject,
        targetKind,
        investigationType,
        context,
        requesterLabel: "Frontend Demo",
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setErrorMessage(payload?.error ?? "HydraSleuth could not launch the live investigation.");
      setIsSubmitting(false);
      return;
    }

    const report = (await response.json()) as InvestigationReport;
    saveReportToLocal(report);
    setIsSubmitting(false);

    startTransition(() => {
      router.push(`/cases/${report.caseRecord.caseId}`);
      router.refresh();
    });
  }

  return (
    <>
      {isSubmitting && mounted && createPortal(
        <motion.div
          key="loading-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center space-y-8 bg-[#050505]/95 px-4 backdrop-blur-md"
        >
          <div className="relative flex h-32 w-32 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-neon/20" />
            <div className="absolute inset-2 animate-spin rounded-full border-4 border-dashed border-neon/40" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-4 animate-spin rounded-full border-4 border-dashed border-blue-500/40" style={{ animationDirection: 'reverse', animationDuration: '4s' }} />
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-neon/20 to-blue-500/20 blur-xl" />
            <Search className="h-10 w-10 text-neon animate-pulse" />
          </div>
          
          <div className="flex flex-col items-center space-y-2 text-center">
            <motion.h3 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-xl font-bold tracking-wider text-white"
            >
              DEPLOYING AGENT SWARM
            </motion.h3>
            <div className="flex items-center space-x-2 text-sm text-white/50">
              <Terminal className="h-4 w-4" />
              <span>Initializing Private Rollup Session...</span>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-4">
            {[
              { icon: Network, label: "Routing via TokenRouter AI..." },
              { icon: Activity, label: "Tracing On-Chain Liquidity..." },
              { icon: Cpu, label: "Extracting Metaplex Authorities..." },
              { icon: Zap, label: "Fusing Swarm Intelligence..." }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.5 }}
                className="flex items-center space-x-4 rounded-xl border border-white/5 bg-white/5 p-4"
              >
                <step.icon className="h-5 w-5 text-neon" />
                <span className="text-sm font-medium text-white/80">{step.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>,
        document.body
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Dispatch form</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                Live Investigation Parameters
              </h2>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Active route</p>
              <p className="mt-1 text-sm font-semibold text-white">{networkLabel}</p>
              <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.1em] text-neon">{cluster}</p>
            </div>
          </div>

          {!liveReady && readinessSummary ? (
            <div className="rounded-xl border border-warning/20 bg-warning/10 p-4 text-warning">
              <span className="text-sm font-medium">{readinessSummary}</span>
            </div>
          ) : null}

          {errorMessage && (
            <div className="flex items-center gap-3 rounded-xl border border-error/20 bg-error/10 p-4 text-error">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">Investigation target</span>
            <div className="relative">
              <Crosshair className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Enter a wallet, mint, or program address"
                className="w-full rounded-xl border border-white/10 bg-[#111]/80 py-4 pl-12 pr-4 text-white placeholder-white/30 outline-none transition focus:border-neon/50 focus:ring-1 focus:ring-neon/50"
              />
            </div>
          </label>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">Target kind</span>
              <div className="relative">
                <select
                  value={targetKind}
                  onChange={(event) => setTargetKind(event.target.value as InvestigationTargetKind)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-[#111] py-4 pl-4 pr-10 text-white outline-none transition focus:border-neon/50 focus:ring-1 focus:ring-neon/50"
                >
                  {kinds.map((kind) => (
                    <option key={kind} value={kind} className="bg-[#111] text-white">
                      {kind.charAt(0).toUpperCase() + kind.slice(1)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                  <svg className="h-4 w-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">Investigation type</span>
              <input
                value={investigationType}
                onChange={(event) => setInvestigationType(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111]/80 py-4 px-4 text-white placeholder-white/30 outline-none transition focus:border-neon/50 focus:ring-1 focus:ring-neon/50"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setInvestigationType(prompt)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 transition hover:border-neon/30 hover:bg-neon/10 hover:text-white"
              >
                {prompt}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">Analyst notes</span>
            <textarea
              value={context}
              onChange={(event) => setContext(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-[#111]/80 p-4 text-white placeholder-white/30 outline-none transition focus:border-neon/50 focus:ring-1 focus:ring-neon/50 resize-none"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Private execution", icon: Zap },
              { label: "Encrypted handoffs", icon: LockKeyhole },
              { label: "Private rewards", icon: ShieldCheck }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <item.icon className="h-4 w-4 text-neon" />
                <p className="text-xs font-semibold text-white/70">{item.label}</p>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={!liveReady}
            className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-neon px-8 py-4 font-bold text-black transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-neon via-white to-neon opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
            <span className="relative flex items-center gap-2">
              {!liveReady ? "Live launch blocked" : "Launch HydraSleuth"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
      </form>
    </>
  );
}
