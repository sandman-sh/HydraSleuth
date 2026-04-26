import { findInvestigationReport } from "@hydrasleuth/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { caseId: string } },
) {
  const report = findInvestigationReport(params.caseId);

  if (!report) {
    return Response.json({ error: "Case not found" }, { status: 404 });
  }

  return Response.json(report);
}
