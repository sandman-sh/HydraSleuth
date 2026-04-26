import { Connection, PublicKey } from "@solana/web3.js";

import { DEFAULT_TREASURY_MINT } from "@hydrasleuth/shared";

export type HydraNetworkProfile = "devnet" | "mainnet" | "localnet";

export type HydraMagicBlockConfig = {
  cluster: HydraNetworkProfile;
  baseRpcUrl: string;
  ephemeralRpcUrl: string;
  ephemeralWsUrl?: string;
  paymentsApiUrl: string;
  validator: PublicKey;
  treasuryMint: string;
  profileLabel: string;
  attestedTeeRequired: boolean;
};

type NetworkPreset = Omit<HydraMagicBlockConfig, "treasuryMint" | "validator"> & {
  validator: string;
};

const NETWORK_PRESETS: Record<HydraNetworkProfile, NetworkPreset> = {
  devnet: {
    cluster: "devnet",
    baseRpcUrl: "https://api.devnet.solana.com",
    ephemeralRpcUrl: "https://devnet-tee.magicblock.app/",
    ephemeralWsUrl: "wss://tee.magicblock.app/",
    paymentsApiUrl: "https://payments.magicblock.app",
    validator: "MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo",
    profileLabel: "Public test network",
    attestedTeeRequired: true,
  },
  mainnet: {
    cluster: "mainnet",
    baseRpcUrl: "https://api.mainnet-beta.solana.com",
    ephemeralRpcUrl: "https://mainnet-tee.magicblock.app/",
    ephemeralWsUrl: "wss://mainnet-tee.magicblock.app/",
    paymentsApiUrl: "https://payments.magicblock.app",
    validator: "MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo",
    profileLabel: "Mainnet",
    attestedTeeRequired: true,
  },
  localnet: {
    cluster: "localnet",
    baseRpcUrl: "http://127.0.0.1:8899",
    ephemeralRpcUrl: "http://127.0.0.1:7799",
    ephemeralWsUrl: "ws://127.0.0.1:7800",
    paymentsApiUrl: "https://payments.magicblock.app",
    validator: "mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev",
    profileLabel: "Local validator",
    attestedTeeRequired: false,
  },
};

function readNetworkProfile(): HydraNetworkProfile {
  const requestedProfile =
    process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? process.env.HYDRA_NETWORK_PROFILE ?? "devnet";

  if (requestedProfile === "testnet") {
    return "devnet";
  }

  if (requestedProfile in NETWORK_PRESETS) {
    return requestedProfile as HydraNetworkProfile;
  }

  return "devnet";
}

export function getHydraMagicBlockConfig(): HydraMagicBlockConfig {
  const profile = readNetworkProfile();
  const preset = NETWORK_PRESETS[profile];

  return {
    cluster: profile,
    baseRpcUrl: process.env.MAGICBLOCK_BASE_RPC_URL ?? preset.baseRpcUrl,
    ephemeralRpcUrl: process.env.MAGICBLOCK_EPHEMERAL_RPC_URL ?? preset.ephemeralRpcUrl,
    ephemeralWsUrl: process.env.MAGICBLOCK_EPHEMERAL_WS_URL ?? preset.ephemeralWsUrl,
    paymentsApiUrl: process.env.MAGICBLOCK_PAYMENTS_API_URL ?? preset.paymentsApiUrl,
    validator: new PublicKey(process.env.MAGICBLOCK_VALIDATOR ?? preset.validator),
    treasuryMint: process.env.TREASURY_MINT ?? DEFAULT_TREASURY_MINT,
    profileLabel: preset.profileLabel,
    attestedTeeRequired: preset.attestedTeeRequired,
  };
}

export function createMagicBlockConnections(config = getHydraMagicBlockConfig()) {
  return {
    baseConnection: new Connection(config.baseRpcUrl, "confirmed"),
    ephemeralConnection: new Connection(config.ephemeralRpcUrl, {
      commitment: "confirmed",
      wsEndpoint: config.ephemeralWsUrl,
    }),
  };
}

export function describeHydraNetwork(config = getHydraMagicBlockConfig()) {
  return {
    cluster: config.cluster,
    label: config.profileLabel,
    baseRpcUrl: config.baseRpcUrl,
    ephemeralRpcUrl: config.ephemeralRpcUrl,
    validator: config.validator.toBase58(),
    attestedTeeRequired: config.attestedTeeRequired,
  };
}
