import type { AgentContribution, InvestigationCaseRecord, AgentSignal } from "@hydrasleuth/shared";

import { fetchWalletFlowSummary } from "../services/helius";
import { tokenrouter, extractJson } from "../services/tokenrouter";

export async function runFlowTracerAgent(
  caseRecord: InvestigationCaseRecord,
): Promise<AgentContribution> {
  let flow: any;
  try {
    flow = await fetchWalletFlowSummary(caseRecord.subject);
  } catch (error: any) {
    console.warn("fetchWalletFlowSummary failed:", error.message);
    return {
      taskId: `${caseRecord.caseId}-flow`,
      agent: "flowTracerAgent",
      headline: "Invalid wallet address or unresolvable subject.",
      summary: `The flow tracer could not resolve the provided subject (${caseRecord.subject}) into a valid on-chain graph.`,
      confidence: 0.9,
      suggestedRiskDelta: 0,
      signals: [
        {
          label: "Invalid Subject",
          severity: "low",
          evidence: error.message || "Failed to initialize wallet trace.",
        },
      ],
      sourceTags: ["helius", "flow-graph", "error"],
    };
  }

  // Deterministic fallback if no API key is configured or API call fails
  const fallback = (): AgentContribution => {
    const signals: AgentSignal[] = [
      {
        label: "Transfer burst",
        severity: flow.recentTransfers >= 12 ? "high" : "medium",
        evidence: `${flow.recentTransfers} recent transfers observed through the Helius-backed flow check.`,
      },
      {
        label: "Counterparty spread",
        severity: flow.uniqueCounterparties >= 8 ? "high" : "low",
        evidence: `${flow.uniqueCounterparties} unique counterparties surfaced in the observation window.`,
      },
      {
        label: "Round-trip pressure",
        severity: flow.rapidRoundTrips >= 2 ? "medium" : "low",
        evidence: `${flow.rapidRoundTrips} possible rapid round-trips suggest cyclical liquidity movement.`,
      },
    ];
    return {
      taskId: `${caseRecord.caseId}-flow`,
      agent: "flowTracerAgent",
      headline: "Fund flow looks unusually dense for the observed time slice.",
      summary: flow.exposureSummary,
      confidence: 0.76,
      suggestedRiskDelta: flow.recentTransfers >= 12 ? 28 : 14,
      signals: [...signals],
      sourceTags: ["helius", "flow-graph", "wallet-history"],
    };
  };

  if (!process.env.TOKENROUTER_API_KEY) {
    console.warn("TOKENROUTER_API_KEY not found. Using deterministic fallback for flowTracerAgent.");
    return fallback();
  }

  try {
    const prompt = `You are an expert blockchain forensics agent specializing in fund flow analysis.
Review the following wallet flow summary for the subject: ${caseRecord.subject}

Data:
${JSON.stringify(flow, null, 2)}

Provide a JSON response matching this exact schema:
{
  "headline": "A one-sentence summary of the main finding",
  "summary": "A detailed 2-3 sentence explanation of the risk and behavior",
  "confidence": <float between 0 and 1>,
  "suggestedRiskDelta": <integer between 0 and 50 representing the added risk score>,
  "signals": [
    {
      "label": "Short name of the signal",
      "severity": "high" | "medium" | "low",
      "evidence": "Why this signal fired based on the data"
    }
  ]
}`;

    const completion = await tokenrouter.chat.completions.create({
      model: "qwen/qwen3.5-122b-a10b",
      messages: [{ role: "user", content: prompt }],
    });

    const result = extractJson(completion.choices[0]?.message.content);

    const contribution: AgentContribution = {
      taskId: `${caseRecord.caseId}-flow`,
      agent: "flowTracerAgent",
      headline: result.headline || fallback().headline,
      summary: result.summary || fallback().summary,
      confidence: result.confidence || 0.8,
      suggestedRiskDelta: result.suggestedRiskDelta || fallback().suggestedRiskDelta,
      signals: result.signals || fallback().signals,
      sourceTags: ["helius", "flow-graph", "wallet-history", "ai-analyzed"],
    };
    return contribution;
  } catch (error: any) {
    console.log("TokenRouter flowTracerAgent failed:", error.message);
    return fallback();
  }
}
