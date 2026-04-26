import { investigateCase, listInvestigationReports } from "@hydrasleuth/agents";
import type { InvestigationCaseInput } from "@hydrasleuth/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(listInvestigationReports());
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as InvestigationCaseInput;
    const report = await investigateCase(input);
    return Response.json(report);
  } catch (error) {
    console.log("API Route Error caught:", error);
    console.log("Is Error?", error instanceof Error);
    console.log("Error type:", typeof error);
    return Response.json(
      {
        error: String(error),
      },
      { status: 500 },
    );
  }
}
