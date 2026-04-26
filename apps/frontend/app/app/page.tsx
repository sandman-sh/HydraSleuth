import { describeHydraNetwork, getHydraRuntimeStatus } from "@hydrasleuth/magicblock-integration";
import { listInvestigationReports } from "@hydrasleuth/agents";

import { HomeDashboard } from "../../components/home-dashboard";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  const reports = listInvestigationReports();
  const network = describeHydraNetwork();
  const runtime = await getHydraRuntimeStatus();

  return <HomeDashboard reports={reports} network={network} runtime={runtime} />;
}
