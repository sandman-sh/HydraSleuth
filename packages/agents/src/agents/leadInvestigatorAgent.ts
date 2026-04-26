import type { AgentTask, InvestigationCaseRecord } from "@hydrasleuth/shared";

export function buildInvestigationPlan(caseRecord: InvestigationCaseRecord): AgentTask[] {
  return [
    {
      id: `${caseRecord.caseId}-flow`,
      assignedTo: "flowTracerAgent",
      title: "Trace fund movement",
      objective: `Trace suspicious fund movement around ${caseRecord.subject} using Helius transaction history.`,
      rewardMicrolamports: 180_000,
    },
    {
      id: `${caseRecord.caseId}-metadata`,
      assignedTo: "metadataSleuthAgent",
      title: "Inspect metadata and authorities",
      objective: `Inspect token/program metadata and privilege surfaces for ${caseRecord.subject}.`,
      rewardMicrolamports: 150_000,
    },
    {
      id: `${caseRecord.caseId}-pattern`,
      assignedTo: "patternDetectorAgent",
      title: "Detect risky behavior patterns",
      objective:
        "Fuse behavioral clues into a risk lens for wash trading, sybil coordination, or rug-pull setup.",
      rewardMicrolamports: 210_000,
    },
  ];
}

import { tokenrouter, extractJson } from "../services/tokenrouter";

export async function synthesizeLeadSummary(headlines: string[], riskScore: number) {
  const fallbackSummary = [
    "HydraSleuth routed the case through a Private Ephemeral Rollup session so every agent handoff and incentive stayed shielded.",
    `The swarm converged on a risk score of ${riskScore}/100 after combining flow analysis, metadata review, and anomaly rules.`,
    `Top findings: ${headlines.join(" | ")}`,
  ].join(" ");

  const fallbackSanitized = "Investigation completed with corroborating private findings. Risk score evaluated securely via MagicBlock.";

  if (!process.env.TOKENROUTER_API_KEY) {
    return { leadSummary: fallbackSummary, sanitizedSummary: fallbackSanitized };
  }

  try {
    const prompt = `You are the Lead Investigator Agent — the orchestrator of a highly advanced decentralized AI Blockchain Forensic Swarm running entirely inside MagicBlock Private Ephemeral Rollups.

Your mission is to produce a professional, enterprise-grade investigation synthesis. The swarm must demonstrate true agentic collaboration: autonomous reasoning, encrypted handoffs, private micropayments, and only sanitized data settled to L1.

**Key Principles:**
- All raw data, chain-of-thought, and sensitive findings stay encrypted inside the Private Ephemeral Rollup.
- Even on low-risk, dormant, or invalid cases, show depth by listing what was thoroughly checked.
- Turn limitations (rate limiting, invalid mint, etc.) into transparent strengths.
- Output must be structured, professional, and authoritative.

The swarm has just concluded an investigation, arriving at a final risk score of ${riskScore}/100.
The individual agents provided the following headline findings:
${headlines.map(h => "- " + h).join("\n")}

Produce a JSON analysis containing:
1. "leadSummary": A 4-6 sentence authoritative cyber-security brief explaining the score with specific on-chain reasoning based on the headlines. Include a clear recommendation (e.g., "Safe to ignore", "Monitor closely", "High rug risk – avoid").
2. "sanitizedSummary": A short privacy-safe string for L1 settlement (no raw addresses or sensitive data).

Schema:
\`\`\`json
{
  "leadSummary": "...",
  "sanitizedSummary": "..."
}
\`\`\``;

    const completion = await tokenrouter.chat.completions.create({
      model: "qwen/qwen3.5-122b-a10b",
      messages: [{ role: "user", content: prompt }],
    });

    const result = extractJson(completion.choices[0]?.message.content);
    return {
      leadSummary: result.leadSummary || fallbackSummary,
      sanitizedSummary: result.sanitizedSummary || fallbackSanitized,
    };
  } catch (error: any) {
    console.log("TokenRouter leadInvestigatorAgent failed:", error.message);
    return { leadSummary: fallbackSummary, sanitizedSummary: fallbackSanitized };
  }
}

