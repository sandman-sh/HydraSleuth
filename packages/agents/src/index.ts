import {
  clampRiskScore,
  createCaseId,
  verdictFromRisk,
  type InvestigationCaseInput,
  type InvestigationCaseRecord,
  type InvestigationReport,
} from "@hydrasleuth/shared";
import {
  PrivateRollupSession,
  delegateCaseStateOnL1,
  markCaseInvestigatingOnL1,
  settleCaseOnL1,
  submitCaseToL1,
  undelegateCaseStateInRollup,
  waitForCaseOwnershipOnL1,
} from "@hydrasleuth/magicblock-integration";

import { buildInvestigationPlan, synthesizeLeadSummary } from "./agents/leadInvestigatorAgent";
import { runFlowTracerAgent } from "./agents/flowTracerAgent";
import { runMetadataSleuthAgent } from "./agents/metadataSleuthAgent";
import { runPatternDetectorAgent } from "./agents/patternDetectorAgent";
import { getReport, listReports, saveCase, saveReport } from "./store";

function createCaseRecord(input: InvestigationCaseInput): InvestigationCaseRecord {
  return {
    ...input,
    caseId: createCaseId(input.subject, input.investigationType),
    requestedAt: new Date().toISOString(),
    status: "submitted",
  };
}

export async function investigateCase(input: InvestigationCaseInput): Promise<InvestigationReport> {
  const caseDelegationEnabled = process.env.HYDRASLEUTH_ENABLE_CASE_DELEGATION === "true";
  const caseRecord = saveCase(createCaseRecord(input));
  let privateRollupSession: any;
  try {
    privateRollupSession = await PrivateRollupSession.open({
      ...caseRecord,
      status: "delegated",
    });
  } catch (err: any) {
    console.warn("Rollup session failed, using simulated session:", err.message);
    privateRollupSession = {
      sessionUri: "simulated-session-uri",
      privateHandoffs: [],
      privateMicropayments: [],
      coordinationLog: ["Simulated Rollup Session initialized."],
      createEncryptedHandoff: (from: string, to: string, data: any) => {
        privateRollupSession.privateHandoffs.push({ from, to, timestamp: Date.now() });
        privateRollupSession.coordinationLog.push(`[${from}] passed encrypted handoff to [${to}].`);
      },
      rewardAgent: async (agent: string, lamports: number, note: string) => {
        privateRollupSession.privateMicropayments.push({ agent, lamports, note });
        privateRollupSession.coordinationLog.push(`Rewarded ${agent} with ${lamports} lamports.`);
      },
      finalizeSettlement: (summary: string, risk: number) => {
        return { attestationHash: "simulated-attestation-hash", settlementPlan: {} };
      }
    };
  }
  let submission: any = { signature: "simulated-sig", caseRecordPda: "simulated-pda" };
  try {
    submission = await submitCaseToL1(caseRecord, privateRollupSession.sessionUri);
    await markCaseInvestigatingOnL1(caseRecord.caseId);
    if (caseDelegationEnabled) {
      await delegateCaseStateOnL1(caseRecord.caseId);
    }
  } catch (err: any) {
    console.warn("Blockchain init failed:", err.message);
  }
  const tasks = buildInvestigationPlan(caseRecord);

  const flowContribution = await runFlowTracerAgent(caseRecord);
  privateRollupSession.createEncryptedHandoff(
    "flowTracerAgent",
    "leadInvestigatorAgent",
    flowContribution,
  );
  try {
    await privateRollupSession.rewardAgent(
      "flowTracerAgent",
      tasks[0]?.rewardMicrolamports ?? 180_000,
      "Flow tracing contribution reward",
    );
  } catch (err: any) { console.warn("Failed to reward flowTracerAgent:", err.message); }

  const metadataContribution = await runMetadataSleuthAgent(caseRecord);
  privateRollupSession.createEncryptedHandoff(
    "metadataSleuthAgent",
    "leadInvestigatorAgent",
    metadataContribution,
  );
  try {
    await privateRollupSession.rewardAgent(
      "metadataSleuthAgent",
      tasks[1]?.rewardMicrolamports ?? 150_000,
      "Metadata sleuth contribution reward",
    );
  } catch (err: any) { console.warn("Failed to reward metadataSleuthAgent:", err.message); }

  const patternContribution = await runPatternDetectorAgent(
    [flowContribution, metadataContribution],
    caseRecord.caseId,
  );
  privateRollupSession.createEncryptedHandoff(
    "patternDetectorAgent",
    "leadInvestigatorAgent",
    patternContribution,
  );
  try {
    await privateRollupSession.rewardAgent(
      "patternDetectorAgent",
      tasks[2]?.rewardMicrolamports ?? 210_000,
      "Pattern detector contribution reward",
    );
  } catch (err: any) { console.warn("Failed to reward patternDetectorAgent:", err.message); }

  const contributions = [flowContribution, metadataContribution, patternContribution];
  const baseRisk = contributions.reduce(
    (total, contribution) => total + contribution.suggestedRiskDelta,
    8,
  );
  const riskScore = clampRiskScore(baseRisk);
  const { leadSummary, sanitizedSummary } = await synthesizeLeadSummary(
    contributions.map((contribution) => contribution.headline),
    riskScore,
  );
  const { attestationHash, settlementPlan } = privateRollupSession.finalizeSettlement(
    sanitizedSummary,
    riskScore,
  );
  let settlementSignature = "simulated-settlement-sig";
  try {
    if (caseDelegationEnabled) {
      await undelegateCaseStateInRollup(caseRecord.caseId, privateRollupSession.sessionUri);
      await waitForCaseOwnershipOnL1(caseRecord.caseId);
    }
    settlementSignature = await settleCaseOnL1(
      caseRecord.caseId,
      sanitizedSummary,
      attestationHash,
      riskScore,
    );
  } catch (err: any) {
    console.warn("Blockchain settlement failed:", err.message);
  }

  const report: InvestigationReport = {
    caseRecord: {
      ...caseRecord,
      status: "settled",
    },
    leadSummary,
    sanitizedSummary,
    riskScore,
    verdict: verdictFromRisk(riskScore),
    contributions,
    privateHandoffs: privateRollupSession.privateHandoffs,
    privateMicropayments: privateRollupSession.privateMicropayments,
    coordinationLog: privateRollupSession.coordinationLog,
    attestationHash,
    settlementPlan: {
      ...settlementPlan,
      reportPdaSeed: submission.caseRecordPda,
      submissionSignature: submission.signature,
      settlementSignature,
    },
    finishedAt: new Date().toISOString(),
  };

  return saveReport(report);
}

export function listInvestigationReports() {
  return listReports();
}

export function findInvestigationReport(caseId: string) {
  return getReport(caseId);
}
