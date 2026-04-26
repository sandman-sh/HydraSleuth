"use client";

import type { InvestigationReport } from "@hydrasleuth/shared";

const STORAGE_KEY = "hydrasleuth_reports";

export function saveReportToLocal(report: InvestigationReport) {
  try {
    const existing = loadAllReportsFromLocal();
    const updated = existing.filter(
      (r) => r.caseRecord.caseId !== report.caseRecord.caseId,
    );
    updated.unshift(report);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable (SSR, quota exceeded)
  }
}

export function loadAllReportsFromLocal(): InvestigationReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InvestigationReport[];
    return parsed.sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
  } catch {
    return [];
  }
}

export function findReportFromLocal(caseId: string): InvestigationReport | null {
  const all = loadAllReportsFromLocal();
  return all.find((r) => r.caseRecord.caseId === caseId) ?? null;
}

export function deleteReportFromLocal(caseId: string) {
  try {
    const all = loadAllReportsFromLocal();
    const filtered = all.filter((r) => r.caseRecord.caseId !== caseId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore
  }
}

export function clearAllReportsFromLocal() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
