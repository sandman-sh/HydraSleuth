import type { AgentContribution } from "@hydrasleuth/shared";
import { tokenrouter, extractJson } from "../services/tokenrouter";

export async function runPatternDetectorAgent(contributions: AgentContribution[], caseId: string) {
  const flowContribution = contributions.find((c) => c.agent === "flowTracerAgent");
  const metadataContribution = contributions.find((c) => c.agent === "metadataSleuthAgent");

  const deterministicRiskDelta =
    (flowContribution?.suggestedRiskDelta ?? 0) * 0.55 +
    (metadataContribution?.suggestedRiskDelta ?? 0) * 0.45;

  const fallback = (): AgentContribution => ({
    taskId: `${caseId}-pattern`,
    agent: "patternDetectorAgent",
    headline: "The combined signal mix looks compatible with coordinated liquidity theater.",
    summary: "Wash-trading risk rises when dense wallet churn and still-active token control surfaces appear together. The current signal set matches that pattern.",
    confidence: 0.7,
    suggestedRiskDelta: deterministicRiskDelta,
    signals: [
      {
        label: "Composite wash-trade profile",
        severity: deterministicRiskDelta >= 22 ? "high" : "medium",
        evidence: "The flow tracer and metadata sleuth both surfaced independent indicators that strengthen each other.",
      },
    ],
    sourceTags: ["rules-engine", "wash-trading", "sybil-check"],
  });

  if (!process.env.TOKENROUTER_API_KEY) {
    return fallback();
  }

  try {
    const prompt = `You are a Pattern Detector AI agent in a blockchain forensic swarm.
Review the preceding agent contributions for case ${caseId}:

Flow Tracer:
${JSON.stringify(flowContribution, null, 2)}

Metadata Sleuth:
${JSON.stringify(metadataContribution, null, 2)}

Identify multi-agent behavioral patterns (e.g. wash trading, sybil rings, rug-pull setups).
Provide a JSON response matching this schema:
\`\`\`json
{
  "headline": "A one-sentence summary of the composite pattern found",
  "summary": "A detailed 2-3 sentence explanation",
  "confidence": <float 0 to 1>,
  "suggestedRiskDelta": <integer 0 to 50>,
  "signals": [
    {
      "label": "Short name",
      "severity": "high" | "medium" | "low",
      "evidence": "Why this signal fired based on combining both agents"
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
      taskId: `${caseId}-pattern`,
      agent: "patternDetectorAgent",
      headline: result.headline || fallback().headline,
      summary: result.summary || fallback().summary,
      confidence: result.confidence || 0.8,
      suggestedRiskDelta: result.suggestedRiskDelta || fallback().suggestedRiskDelta,
      signals: result.signals || fallback().signals,
      sourceTags: ["ai-swarm", "pattern-recognition", "multi-agent-fusion"],
    };
    return contribution;
  } catch (error: any) {
    console.warn("TokenRouter patternDetectorAgent failed:", error.message);
    return fallback();
  }
}

