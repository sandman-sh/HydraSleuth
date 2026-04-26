import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { resolveWorkspacePath } from "@hydrasleuth/magicblock-integration";
import type { InvestigationCaseRecord, InvestigationReport } from "@hydrasleuth/shared";

const reports = new Map<string, InvestigationReport>();
const cases = new Map<string, InvestigationCaseRecord>();
const storageFile = resolveWorkspacePath(".hydrasleuth-data", "investigations.json");

let hydrated = false;

type PersistedStore = {
  cases: InvestigationCaseRecord[];
  reports: InvestigationReport[];
};

function hydrateStore() {
  if (hydrated) {
    return;
  }

  hydrated = true;

  if (!existsSync(storageFile)) {
    return;
  }

  try {
    const payload = JSON.parse(readFileSync(storageFile, "utf8")) as PersistedStore;

    for (const caseRecord of payload.cases ?? []) {
      cases.set(caseRecord.caseId, caseRecord);
    }

    for (const report of payload.reports ?? []) {
      reports.set(report.caseRecord.caseId, report);
    }
  } catch {
    // Ignore malformed persistence and continue with an empty in-memory store.
  }
}

function persistStore() {
  try {
    mkdirSync(dirname(storageFile), { recursive: true });
    writeFileSync(
      storageFile,
      JSON.stringify(
        {
          cases: [...cases.values()],
          reports: [...reports.values()],
        } satisfies PersistedStore,
        null,
        2,
      ),
    );
  } catch {
    // Ignore write errors on read-only filesystems like Vercel
  }
}

export function saveCase(caseRecord: InvestigationCaseRecord) {
  hydrateStore();
  cases.set(caseRecord.caseId, caseRecord);
  persistStore();
  return caseRecord;
}

export function saveReport(report: InvestigationReport) {
  hydrateStore();
  reports.set(report.caseRecord.caseId, report);
  cases.set(report.caseRecord.caseId, report.caseRecord);
  persistStore();
  return report;
}

export function getReport(caseId: string) {
  hydrateStore();
  return reports.get(caseId) ?? null;
}

export function listReports() {
  hydrateStore();
  return [...reports.values()].sort((left, right) =>
    right.finishedAt.localeCompare(left.finishedAt),
  );
}

export function listCases() {
  hydrateStore();
  return [...cases.values()].sort((left, right) => right.requestedAt.localeCompare(left.requestedAt));
}
