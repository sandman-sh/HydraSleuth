import { Connection, PublicKey } from "@solana/web3.js";

import { getHydraMagicBlockConfig } from "@hydrasleuth/magicblock-integration";

export type WalletFlowSummary = {
  recentTransfers: number;
  uniqueCounterparties: number;
  rapidRoundTrips: number;
  exposureSummary: string;
};

function isRateLimitError(error: unknown) {
  return error instanceof Error && /429|too many requests/i.test(error.message);
}

function getHeliusRpcUrl() {
  if (process.env.HELIUS_RPC_URL) {
    return process.env.HELIUS_RPC_URL;
  }

  if (process.env.HELIUS_API_KEY) {
    return `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
  }

  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? getHydraMagicBlockConfig().baseRpcUrl;
}

export async function fetchWalletFlowSummary(address: string): Promise<WalletFlowSummary> {
  const connection = new Connection(getHeliusRpcUrl(), "confirmed");
  const wallet = new PublicKey(address);
  const signatures = await connection.getSignaturesForAddress(wallet, { limit: 6 });
  const counterparties = new Map<string, number>();
  let parsedCount = 0;

  try {
    const parsedTransactions = await connection.getParsedTransactions(
      signatures.slice(0, 3).map((signature) => signature.signature),
      {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      },
    );

    parsedCount = parsedTransactions.filter(Boolean).length;

    for (const parsedTransaction of parsedTransactions) {
      for (const accountKey of parsedTransaction?.transaction.message.accountKeys ?? []) {
        const pubkey =
          typeof accountKey === "object" && accountKey !== null && "pubkey" in accountKey
            ? accountKey.pubkey.toBase58()
            : String(accountKey);

        if (pubkey === wallet.toBase58()) {
          continue;
        }

        counterparties.set(pubkey, (counterparties.get(pubkey) ?? 0) + 1);
      }
    }
  } catch (error) {
    if (!isRateLimitError(error)) {
      throw error;
    }
  }

  const repeatCounterparties = [...counterparties.values()].filter((count) => count >= 2).length;
  const summaryTail =
    parsedCount > 0
      ? `Parsed ${parsedCount} recent transactions and observed ${counterparties.size} distinct counterparties.`
      : "Parsed transaction expansion was rate-limited, so this pass used the live signature window only.";

  return {
    recentTransfers: signatures.length,
    uniqueCounterparties: counterparties.size,
    rapidRoundTrips: repeatCounterparties,
    exposureSummary: `RPC returned ${signatures.length} recent signatures for ${address}. ${summaryTail}`,
  };
}
