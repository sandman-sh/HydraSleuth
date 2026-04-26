import type { AgentContribution, InvestigationCaseRecord, AgentSignal } from "@hydrasleuth/shared";

import { fetchProgramAccountSummary, fetchWalletAccountSummary } from "../services/program";
import { fetchTokenMetadataSummary } from "../services/metaplex";
import { tokenrouter, extractJson } from "../services/tokenrouter";

export async function runMetadataSleuthAgent(
  caseRecord: InvestigationCaseRecord,
): Promise<AgentContribution> {
  if (caseRecord.targetKind === "program") {
    let programAccount: any;
    try {
      programAccount = await fetchProgramAccountSummary(caseRecord.subject);
    } catch (e: any) {
      console.warn("fetchProgramAccountSummary failed:", e.message);
      return {
        taskId: `${caseRecord.caseId}-metadata`,
        agent: "metadataSleuthAgent",
        headline: "Target account could not be resolved as a valid program.",
        summary: `The provided address (${caseRecord.subject}) threw an error during program metadata resolution. It may not be a valid program.`,
        confidence: 0.9,
        suggestedRiskDelta: 15,
        signals: [
          {
            label: "Invalid Program",
            severity: "medium",
            evidence: e.message || "Failed to load program account data.",
          },
        ],
        sourceTags: ["solana-rpc", "program-account", "error"],
      };
    }

    const fallback: AgentContribution = {
      taskId: `${caseRecord.caseId}-metadata`,
      agent: "metadataSleuthAgent",
      headline: programAccount.executable
        ? "Executable program surface is live and should be reviewed for upgrade authority and delegated state."
        : "Program target is not executable on the selected cluster, which is already a material signal.",
      summary: `Owner ${programAccount.owner}, executable=${programAccount.executable}, data length ${programAccount.dataLength} bytes, balance ${programAccount.lamports} lamports.`,
      confidence: 0.74,
      suggestedRiskDelta: programAccount.executable ? 18 : 30,
      signals: [
        {
          label: "Executable flag",
          severity: programAccount.executable ? "medium" : "high",
          evidence: programAccount.executable
            ? "The account is executable and participates as a live program."
            : "The provided program target is not executable on chain.",
        },
        {
          label: "Program owner",
          severity: programAccount.owner === "BPFLoaderUpgradeab1e11111111111111111111111" ? "medium" : "low",
          evidence: `Owner program is ${programAccount.owner}.`,
        },
      ],
      sourceTags: ["solana-rpc", "program-account", "owner-check"],
    };

    if (!process.env.TOKENROUTER_API_KEY) return fallback;

    try {
      const prompt = `You are a Metadata Sleuth AI agent in a blockchain forensic swarm.
Analyze the following Solana program account data for case ${caseRecord.caseId}:
${JSON.stringify(programAccount, null, 2)}

Produce a JSON analysis of the program's risk profile (look for upgradeability, executable status, and ownership anomalies).
Schema:
\`\`\`json
{
  "headline": "A one-sentence summary of the program risk",
  "summary": "A 2-3 sentence explanation",
  "confidence": <float 0 to 1>,
  "suggestedRiskDelta": <integer 0 to 50>,
  "signals": [
    {
      "label": "Short name",
      "severity": "high" | "medium" | "low",
      "evidence": "Why this signal fired"
    }
  ]
}
\`\`\``;
      const completion = await tokenrouter.chat.completions.create({
        model: "qwen/qwen3.5-122b-a10b",
        messages: [{ role: "user", content: prompt }],
      });
      const result = extractJson(completion.choices[0]?.message.content);
      const contribution: AgentContribution = {
        ...fallback,
        headline: result.headline || fallback.headline,
        summary: result.summary || fallback.summary,
        confidence: result.confidence || fallback.confidence,
        suggestedRiskDelta: result.suggestedRiskDelta || fallback.suggestedRiskDelta,
        signals: result.signals || fallback.signals,
      };
      return contribution;
    } catch (e: any) {
      console.warn("TokenRouter metadataSleuthAgent program failed:", e.message);
      return fallback;
    }
  }

  if (caseRecord.targetKind === "wallet") {
    let walletAccount: any;
    try {
      walletAccount = await fetchWalletAccountSummary(caseRecord.subject);
    } catch (e: any) {
      console.warn("fetchWalletAccountSummary failed:", e.message);
      return {
        taskId: `${caseRecord.caseId}-metadata`,
        agent: "metadataSleuthAgent",
        headline: "Target account could not be resolved as a valid wallet.",
        summary: `The provided address (${caseRecord.subject}) threw an error during resolution.`,
        confidence: 0.9,
        suggestedRiskDelta: 0,
        signals: [{ label: "Invalid Wallet", severity: "low", evidence: e.message || "Failed to load wallet data." }],
        sourceTags: ["solana-rpc", "wallet-account", "error"],
      };
    }

    const fallback: AgentContribution = {
      taskId: `${caseRecord.caseId}-metadata`,
      agent: "metadataSleuthAgent",
      headline: `Target is a wallet holding ${walletAccount.solBalance.toFixed(4)} SOL.`,
      summary: "Wallets do not expose mint/freeze authorities. The risk profile is strictly behavioral.",
      confidence: 0.9,
      suggestedRiskDelta: walletAccount.solBalance < 0.05 ? 10 : 5,
      signals: [
        {
          label: "Wallet surface",
          severity: walletAccount.solBalance < 0.05 ? "medium" : "low",
          evidence: `Standard system account holding ${walletAccount.solBalance} SOL. Low balances may indicate a burner wallet.`,
        },
      ],
      sourceTags: ["solana-rpc", "wallet-account"],
    };

    if (!process.env.TOKENROUTER_API_KEY) return fallback;

    try {
      const prompt = `You are a Metadata Sleuth AI agent in a blockchain forensic swarm.
Analyze the following Solana wallet account data for case ${caseRecord.caseId}:
${JSON.stringify(walletAccount, null, 2)}

Produce a JSON analysis of the wallet's metadata risk profile. Low balances (e.g., < 0.05 SOL) might indicate temporary burner or sybil wallets.
Schema:
\`\`\`json
{
  "headline": "A one-sentence summary of the wallet metadata risk",
  "summary": "A 2-3 sentence explanation",
  "confidence": <float 0 to 1>,
  "suggestedRiskDelta": <integer 0 to 50>,
  "signals": [
    {
      "label": "Short name",
      "severity": "high" | "medium" | "low",
      "evidence": "Why this signal fired"
    }
  ]
}
\`\`\``;
      const completion = await tokenrouter.chat.completions.create({
        model: "qwen/qwen3.5-122b-a10b",
        messages: [{ role: "user", content: prompt }],
      });
      const result = extractJson(completion.choices[0]?.message.content);
      const contribution: AgentContribution = {
        ...fallback,
        headline: result.headline || fallback.headline,
        summary: result.summary || fallback.summary,
        confidence: result.confidence || fallback.confidence,
        suggestedRiskDelta: result.suggestedRiskDelta || fallback.suggestedRiskDelta,
        signals: result.signals || fallback.signals,
      };
      return contribution;
    } catch (e: any) {
      console.warn("TokenRouter metadataSleuthAgent wallet failed:", e.message);
      return fallback;
    }
  }

  let metadata: any;
  try {
    metadata = await fetchTokenMetadataSummary(caseRecord.subject);
  } catch (e: any) {
    console.warn("fetchTokenMetadataSummary failed:", e.message);
    return {
      taskId: `${caseRecord.caseId}-metadata`,
      agent: "metadataSleuthAgent",
      headline: "Target account could not be resolved as a valid token mint.",
      summary: `The provided address (${caseRecord.subject}) threw an error during token metadata resolution. It may be a regular wallet or invalid token mint.`,
      confidence: 0.9,
      suggestedRiskDelta: 10,
      signals: [
        {
          label: "Invalid Token",
          severity: "low",
          evidence: e.message || "Failed to load token metadata. Account may not be an SPL token.",
        },
      ],
      sourceTags: ["metaplex", "token-metadata", "error"],
    };
  }

  const fallback: AgentContribution = {
    taskId: `${caseRecord.caseId}-metadata`,
    agent: "metadataSleuthAgent",
    headline: "Authority surface remains flexible, which increases intervention risk.",
    summary: `${metadata.name} (${metadata.symbol}) exposes ${
      metadata.hasMintAuthority ? "an active mint authority" : "no mint authority"
    } and ${metadata.hasFreezeAuthority ? "a freeze authority" : "no freeze authority"}.`,
    confidence: 0.72,
    suggestedRiskDelta: metadata.hasMintAuthority || metadata.hasFreezeAuthority ? 24 : 8,
    signals: [
      {
        label: "Mint authority",
        severity: metadata.hasMintAuthority ? "high" : "low",
        evidence: metadata.hasMintAuthority
          ? "Mint authority is still active and could expand supply."
          : "Mint authority appears burned.",
      },
      {
        label: "Freeze authority",
        severity: metadata.hasFreezeAuthority ? "medium" : "low",
        evidence: metadata.hasFreezeAuthority
          ? "Freeze authority could halt user movement."
          : "Freeze authority not detected.",
      },
      {
        label: "Mutable metadata",
        severity: metadata.isMutable ? "medium" : "low",
        evidence: metadata.isMutable
          ? "Metadata is mutable and project messaging can still change."
          : "Metadata appears immutable.",
      },
    ],
    sourceTags: ["metaplex", "token-metadata", "authority-check"],
  };

  if (!process.env.TOKENROUTER_API_KEY) return fallback;

  try {
    const prompt = `You are a Metadata Sleuth AI agent in a blockchain forensic swarm.
Analyze the following token metadata for case ${caseRecord.caseId}:
${JSON.stringify(metadata, null, 2)}

Identify risks related to mint authority, freeze authority, and mutability.
Provide a JSON response matching this schema:
\`\`\`json
{
  "headline": "A one-sentence summary of the token authority risk",
  "summary": "A 2-3 sentence explanation",
  "confidence": <float 0 to 1>,
  "suggestedRiskDelta": <integer 0 to 50>,
  "signals": [
    {
      "label": "Short name",
      "severity": "high" | "medium" | "low",
      "evidence": "Why this signal fired based on the metadata"
    }
  ]
}
\`\`\``;
    const completion = await tokenrouter.chat.completions.create({
      model: "qwen/qwen3.5-122b-a10b",
      messages: [{ role: "user", content: prompt }],
    });
    const result = extractJson(completion.choices[0]?.message.content);
    const contribution: AgentContribution = {
      ...fallback,
      headline: result.headline || fallback.headline,
      summary: result.summary || fallback.summary,
      confidence: result.confidence || fallback.confidence,
      suggestedRiskDelta: result.suggestedRiskDelta || fallback.suggestedRiskDelta,
      signals: result.signals || fallback.signals,
    };
    return contribution;
  } catch (e: any) {
    console.warn("TokenRouter metadataSleuthAgent token failed:", e.message);
    return fallback;
  }
}
