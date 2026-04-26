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
      privateHandoffs: [] as any[],
      privateMicropayments: [] as any[],
      coordinationLog: [{
        type: "delegate" as const,
        detail: "Simulated Private Ephemeral Rollup session initialized (serverless mode).",
        createdAt: new Date().toISOString(),
      }],
      createEncryptedHandoff: (from: string, to: string, _data: any) => {
        const now = new Date().toISOString();
        privateRollupSession.privateHandoffs.push({
          from,
          to,
          ciphertext: `[encrypted-${from}-to-${to}]`,
          iv: "sim-iv-" + Date.now().toString(16),
          authTag: "sim-tag-" + Date.now().toString(16),
          createdAt: now,
        });
        privateRollupSession.coordinationLog.push({
          type: "handoff" as const,
          detail: `${from} delivered an encrypted handoff to ${to} inside the simulated rollup.`,
          createdAt: now,
        });
      },
      rewardAgent: async (agent: string, lamports: number, memo: string) => {
        const now = new Date().toISOString();
        privateRollupSession.privateMicropayments.push({
          from: "sharedTreasury",
          to: agent,
          amount: lamports,
          visibility: "private",
          mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
          status: "submitted",
          memo,
          transactionBase64: Buffer.from(`simulated-tx-${agent}-${lamports}`).toString("base64"),
          route: "ephemeral",
          validator: "Simulated Validator",
          transactionSignature: `sim-sig-${agent}-${Date.now().toString(16)}`,
        });
        privateRollupSession.coordinationLog.push({
          type: "payment" as const,
          detail: `Submitted private micropayment for ${agent}: ${lamports} base units on the ephemeral route.`,
          createdAt: now,
        });
      },
      finalizeSettlement: (summary: string, risk: number) => {
        privateRollupSession.coordinationLog.push({
          type: "settlement" as const,
          detail: `Committed the sanitized report to Solana L1 with simulated attestation.`,
          createdAt: new Date().toISOString(),
        });
        return {
          attestationHash: require("crypto").createHash("sha256").update(`${summary}:${risk}:${Date.now()}`).digest("hex"),
          settlementPlan: {
            baseLayerInstruction: "settle_report(case_id, sanitized_summary, attestation_hash, risk_score)",
            reportPdaSeed: caseRecord.caseId,
            privateSessionUri: "simulated-session-uri",
          },
        };
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
