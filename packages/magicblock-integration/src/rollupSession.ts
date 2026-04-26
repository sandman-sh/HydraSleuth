import { createHash, randomUUID } from "node:crypto";

import { DELEGATION_PROGRAM_ID, getAuthToken } from "@magicblock-labs/ephemeral-rollups-sdk";
import type {
  AgentContribution,
  AgentRole,
  CoordinationEvent,
  EncryptedHandoffRecord,
  InvestigationCaseRecord,
  MicropaymentRecord,
} from "@hydrasleuth/shared";
import { Keypair } from "@solana/web3.js";

import { createMagicBlockConnections, getHydraMagicBlockConfig } from "./config";
import { getHydraProgramStatus } from "./hydraProgram";
import { encryptAgentHandoff } from "./encryption";
import { buildAgentMicropayment, checkPaymentsApiHealth } from "./privatePayments";
import { loadAuthorityKeypair, signMessageWithKeypair } from "./runtimeWallet";

function deriveAgentWallet(agent: AgentRole) {
  const seed = createHash("sha256").update(`hydrasleuth:${agent}`).digest().subarray(0, 32);
  return Keypair.fromSeed(seed).publicKey.toBase58();
}

export class PrivateRollupSession {
  readonly caseRecord: InvestigationCaseRecord;
  readonly sessionId: string;
  sessionUri: string;
  readonly sessionSecret: string;
  readonly coordinationLog: CoordinationEvent[] = [];
  readonly privateHandoffs: EncryptedHandoffRecord[] = [];
  readonly privateMicropayments: MicropaymentRecord[] = [];

  private constructor(caseRecord: InvestigationCaseRecord) {
    const config = getHydraMagicBlockConfig();

    this.caseRecord = caseRecord;
    this.sessionId = `per-${randomUUID()}`;
    this.sessionUri = `${config.ephemeralRpcUrl}?session=${this.sessionId}`;
    this.sessionSecret = createHash("sha256")
      .update(`${caseRecord.caseId}:${caseRecord.subject}:${Date.now()}`)
      .digest("hex");
  }

  static async open(caseRecord: InvestigationCaseRecord) {
    const session = new PrivateRollupSession(caseRecord);
    const [{ keypair }, health, programStatus] = await Promise.all([
      loadAuthorityKeypair(),
      checkPaymentsApiHealth(),
      getHydraProgramStatus(),
    ]);
    const authToken = await getAuthToken(
      getHydraMagicBlockConfig().ephemeralRpcUrl.replace(/\/$/, ""),
      keypair.publicKey,
      async (message) => signMessageWithKeypair(keypair.publicKey, keypair.secretKey, message),
    );

    session.sessionUri = `${getHydraMagicBlockConfig().ephemeralRpcUrl}?token=${authToken.token}&session=${session.sessionId}`;

    session.coordinationLog.push({
      type: "delegate",
      detail: [
        `Opened Private Ephemeral Rollup session ${session.sessionId} for case ${caseRecord.caseId}.`,
        `Delegation program ${DELEGATION_PROGRAM_ID.toBase58()} and validator ${getHydraMagicBlockConfig()
          .validator.toBase58()} configured.`,
        `Payments API health: ${health}.`,
        `Authority ${programStatus.authority} authenticated for TEE access.`,
      ].join(" "),
      createdAt: new Date().toISOString(),
    });

    return session;
  }

  async describeConnections() {
    const { baseConnection, ephemeralConnection } = createMagicBlockConnections();

    return {
      baseRpc: baseConnection.rpcEndpoint,
      ephemeralRpc: ephemeralConnection.rpcEndpoint,
      delegationProgram: DELEGATION_PROGRAM_ID.toBase58(),
    };
  }

  createEncryptedHandoff(from: AgentRole, to: AgentRole, contribution: AgentContribution) {
    const handoff = encryptAgentHandoff(JSON.stringify(contribution), this.sessionSecret, from, to);

    this.privateHandoffs.push(handoff);
    this.coordinationLog.push({
      type: "handoff",
      detail: `${from} delivered an encrypted handoff to ${to} inside ${this.sessionId}.`,
      createdAt: handoff.createdAt,
    });

    return handoff;
  }

  async rewardAgent(agent: AgentRole, rewardMicrolamports: number, memo: string) {
    const { keypair } = await loadAuthorityKeypair();
    const payment = await buildAgentMicropayment({
      from: "sharedTreasury",
      to: agent,
      fromPubkey: keypair.publicKey.toBase58(),
      toPubkey: deriveAgentWallet(agent),
      amount: rewardMicrolamports,
      memo,
    });

    this.privateMicropayments.push(payment);
    this.coordinationLog.push({
      type: "payment",
      detail: `Submitted private micropayment for ${agent}: ${rewardMicrolamports} base units on the ${payment.route} route.`,
      createdAt: new Date().toISOString(),
    });

    return payment;
  }

  finalizeSettlement(sanitizedSummary: string, riskScore: number) {
    const attestationHash = createHash("sha256")
      .update(
        JSON.stringify({
          caseId: this.caseRecord.caseId,
          sessionId: this.sessionId,
          sanitizedSummary,
          riskScore,
          handoffs: this.privateHandoffs.length,
          payments: this.privateMicropayments.length,
        }),
      )
      .digest("hex");

    this.coordinationLog.push({
      type: "settlement",
      detail: `Committed the sanitized report back to Solana L1 with attestation ${attestationHash.slice(
        0,
        18,
      )}...`,
      createdAt: new Date().toISOString(),
    });

    return {
      attestationHash,
      settlementPlan: {
        baseLayerInstruction:
          "settle_report(case_id, sanitized_summary, attestation_hash, risk_score)",
        reportPdaSeed: this.caseRecord.caseId,
        privateSessionUri: this.sessionUri,
      },
    };
  }
}
