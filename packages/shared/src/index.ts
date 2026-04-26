export type InvestigationTargetKind = "wallet" | "token" | "program";

export type InvestigationCaseInput = {
  subject: string;
  targetKind: InvestigationTargetKind;
  investigationType: string;
  requesterLabel?: string;
  context?: string;
};

export type InvestigationCaseRecord = InvestigationCaseInput & {
  caseId: string;
  requestedAt: string;
  status: "submitted" | "delegated" | "investigating" | "settled";
};

export type AgentRole =
  | "leadInvestigatorAgent"
  | "flowTracerAgent"
  | "metadataSleuthAgent"
  | "patternDetectorAgent";

export type AgentTask = {
  id: string;
  assignedTo: AgentRole;
  title: string;
  objective: string;
  rewardMicrolamports: number;
};

export type AgentSignal = {
  label: string;
  severity: "low" | "medium" | "high";
  evidence: string;
};

export type AgentContribution = {
  taskId: string;
  agent: AgentRole;
  headline: string;
  summary: string;
  confidence: number;
  suggestedRiskDelta: number;
  signals: AgentSignal[];
  sourceTags: string[];
};

export type EncryptedHandoffRecord = {
  from: AgentRole;
  to: AgentRole;
  ciphertext: string;
  iv: string;
  authTag: string;
  createdAt: string;
};

export type MicropaymentRecord = {
  from: AgentRole | "sharedTreasury";
  to: AgentRole;
  amount: number;
  visibility: "private";
  mint: string;
  status: "submitted";
  memo: string;
  transactionBase64: string;
  route: "base" | "ephemeral";
  validator: string;
  transactionSignature?: string;
};

export type CoordinationEvent =
  | { type: "delegate"; detail: string; createdAt: string }
  | { type: "handoff"; detail: string; createdAt: string }
  | { type: "payment"; detail: string; createdAt: string }
  | { type: "settlement"; detail: string; createdAt: string };

export type InvestigationReport = {
  caseRecord: InvestigationCaseRecord;
  leadSummary: string;
  sanitizedSummary: string;
  riskScore: number;
  verdict: "low" | "guarded" | "elevated" | "critical";
  contributions: AgentContribution[];
  privateHandoffs: EncryptedHandoffRecord[];
  privateMicropayments: MicropaymentRecord[];
  coordinationLog: CoordinationEvent[];
  attestationHash: string;
  settlementPlan: {
    baseLayerInstruction: string;
    reportPdaSeed: string;
    privateSessionUri: string;
    submissionSignature?: string;
    settlementSignature?: string;
  };
  finishedAt: string;
};

export const DEFAULT_TREASURY_MINT =
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const CASE_ID_SEED_SAFE_MAX_LEN = 32;
export const INVESTIGATION_TYPE_PROTOCOL_MAX_LEN = 32;

export const AGENT_DIRECTORY: Record<AgentRole, { label: string; specialty: string }> = {
  leadInvestigatorAgent: {
    label: "Lead Investigator",
    specialty: "case decomposition, synthesis, and final settlement",
  },
  flowTracerAgent: {
    label: "Flow Tracer",
    specialty: "wallet graphing and fund movement inspection via Helius",
  },
  metadataSleuthAgent: {
    label: "Metadata Sleuth",
    specialty: "Metaplex metadata, authority, and token configuration review",
  },
  patternDetectorAgent: {
    label: "Pattern Detector",
    specialty: "wash trading, sybil, and rug-pull rule evaluation",
  },
};

export function createCaseId(subject: string, investigationType: string): string {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const availableNormalizedLength = CASE_ID_SEED_SAFE_MAX_LEN - "case--".length - randomSuffix.length;
  const normalized = `${subject}-${investigationType}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, availableNormalizedLength);

  return `case-${normalized}-${randomSuffix}`;
}

const protocolInvestigationTypeAliases: Record<string, string> = {
  "investigate possible wash trading": "wash-trading-scan",
  "analyze for rug-pull risk": "rug-pull-risk-scan",
  "check for suspicious pda behavior": "pda-behavior-scan",
};

export function toProtocolInvestigationType(investigationType: string): string {
  const normalizedInput = investigationType.trim().toLowerCase();
  const aliased = protocolInvestigationTypeAliases[normalizedInput];

  if (aliased) {
    return aliased;
  }

  const normalized = normalizedInput
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, INVESTIGATION_TYPE_PROTOCOL_MAX_LEN);

  return normalized || "custom-investigation";
}

export function clampRiskScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function verdictFromRisk(score: number): InvestigationReport["verdict"] {
  if (score >= 80) {
    return "critical";
  }

  if (score >= 60) {
    return "elevated";
  }

  if (score >= 35) {
    return "guarded";
  }

  return "low";
}
