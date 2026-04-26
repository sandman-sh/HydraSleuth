"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { InvestigationReport } from "@hydrasleuth/shared";

import { findReportFromLocal } from "../../lib/report-store";
import { CaseDetailShell } from "../case-detail-shell";

export function CaseDetailClient({ caseId }: { caseId: string }) {
  const [report, setReport] = useState<InvestigationReport | null>(null);
  const [notFound, setNotFound] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const found = findReportFromLocal(caseId);
    if (found) {
      setReport(found);
    } else {
      // Try API fallback for server-stored reports
      fetch(`/api/cases/${caseId}`)
        .then((res) => {
          if (!res.ok) {
            setNotFound(true);
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data) setReport(data);
          else setNotFound(true);
        })
        .catch(() => setNotFound(true));
    }
  }, [caseId]);

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Case Not Found</h1>
          <p className="text-white/60">
            No investigation report was found for <code className="text-neon">{caseId}</code>.
          </p>
          <button
            onClick={() => router.push("/app")}
            className="rounded-full border border-neon/30 bg-neon/10 px-6 py-3 text-sm font-medium text-neon hover:bg-neon/20 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-neon/30 border-t-neon" />
          <p className="text-sm text-white/50">Loading case report…</p>
        </div>
      </main>
    );
  }

  return <CaseDetailShell report={report} />;
}
