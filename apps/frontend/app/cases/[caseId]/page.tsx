import { CaseDetailClient } from "../../../components/cases/case-detail-client";

export const dynamic = "force-dynamic";

export default function CasePage({
  params,
}: {
  params: { caseId: string };
}) {
  return <CaseDetailClient caseId={params.caseId} />;
}
