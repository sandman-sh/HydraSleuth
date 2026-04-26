import { getAuthToken } from "@magicblock-labs/ephemeral-rollups-sdk";

import { describeHydraNetwork, getHydraMagicBlockConfig } from "./config";
import { getHydraProgramStatus } from "./hydraProgram";
import { checkPaymentsApiHealth } from "./privatePayments";
import { loadAuthorityKeypair, signMessageWithKeypair } from "./runtimeWallet";

export type HydraRuntimeStatus = ReturnType<typeof describeHydraNetwork> & {
  authority: string;
  authorityBalanceLamports: number;
  authorityBalanceSol: string;
  keypairPath: string;
  programId: string;
  programDeployed: boolean;
  treasury: string;
  paymentsApiHealthy: boolean;
  teeAuthReady: boolean;
  readyForLiveCases: boolean;
  blockers: string[];
  checkedAt: string;
};

export async function getHydraRuntimeStatus(): Promise<HydraRuntimeStatus> {
  const network = describeHydraNetwork();
  const config = getHydraMagicBlockConfig();
  const programStatus = await getHydraProgramStatus();
  const { keypairPath, keypair } = await loadAuthorityKeypair();

  const blockers: string[] = [];
  let paymentsApiHealthy = false;
  let teeAuthReady = false;

  try {
    await checkPaymentsApiHealth();
    paymentsApiHealthy = true;
  } catch (error) {
    blockers.push(
      error instanceof Error
        ? `MagicBlock Payments API is unavailable: ${error.message}`
        : "MagicBlock Payments API health check failed.",
    );
  }

  try {
    await getAuthToken(
      config.ephemeralRpcUrl.replace(/\/$/, ""),
      keypair.publicKey,
      async (message) => signMessageWithKeypair(keypair.publicKey, keypair.secretKey, message),
    );
    teeAuthReady = true;
  } catch (error) {
    blockers.push(
      error instanceof Error
        ? `TEE authentication is not ready: ${error.message}`
        : "TEE authentication is not ready.",
    );
  }

  if (!programStatus.deployed) {
    blockers.push(
      `Anchor program ${programStatus.programId} is not deployed on devnet. Current authority balance is ${(programStatus.authorityBalanceLamports / 1_000_000_000).toFixed(6)} SOL and the most recent deploy attempt needed about 2.302124 SOL.`,
    );
  }

  return {
    ...network,
    authority: programStatus.authority,
    authorityBalanceLamports: programStatus.authorityBalanceLamports,
    authorityBalanceSol: (programStatus.authorityBalanceLamports / 1_000_000_000).toFixed(6),
    keypairPath,
    programId: programStatus.programId,
    programDeployed: programStatus.deployed,
    treasury: programStatus.treasury,
    paymentsApiHealthy,
    teeAuthReady,
    readyForLiveCases: programStatus.deployed && paymentsApiHealthy && teeAuthReady,
    blockers,
    checkedAt: new Date().toISOString(),
  };
}
