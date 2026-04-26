import type { AgentRole, MicropaymentRecord } from "@hydrasleuth/shared";
import { getAuthToken } from "@magicblock-labs/ephemeral-rollups-sdk";
import { Connection, Transaction } from "@solana/web3.js";

import { getHydraMagicBlockConfig } from "./config";
import { loadAuthorityKeypair, signMessageWithKeypair } from "./runtimeWallet";

type TransactionBuildResponse = {
  kind: string;
  version: string;
  transactionBase64: string;
  sendTo: "base" | "ephemeral";
  requiredSigners: string[];
  validator: string;
  recentBlockhash: string;
  lastValidBlockHeight: number;
};

type PrivateTransferInput = {
  from: AgentRole | "sharedTreasury";
  to: AgentRole;
  fromPubkey: string;
  toPubkey: string;
  amount: number;
  memo: string;
  mint?: string;
};

async function tryJsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = (await response.json().catch(() => null)) as T | { error?: { message?: string } } | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error?.message ?? `MagicBlock Payments API returned ${response.status}`
        : `MagicBlock Payments API returned ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export async function checkPaymentsApiHealth(): Promise<"ok"> {
  const config = getHydraMagicBlockConfig();
  const result = await tryJsonFetch<{ status: string }>(`${config.paymentsApiUrl}/health`);

  if (result.status !== "ok") {
    throw new Error(`MagicBlock Payments API health returned ${result.status}.`);
  }

  return "ok";
}

async function sendUnsignedTransaction(
  unsignedTransaction: TransactionBuildResponse,
  transactionBase64: string,
) {
  const { keypair } = await loadAuthorityKeypair();
  const config = getHydraMagicBlockConfig();
  const ephemeralEndpoint =
    unsignedTransaction.sendTo === "ephemeral"
      ? `${config.ephemeralRpcUrl.replace(/\/$/, "")}?token=${
          (
            await getAuthToken(
              config.ephemeralRpcUrl.replace(/\/$/, ""),
              keypair.publicKey,
              async (message) =>
                signMessageWithKeypair(keypair.publicKey, keypair.secretKey, message),
            )
          ).token
        }`
      : config.baseRpcUrl;
  const connection = new Connection(
    ephemeralEndpoint,
    "confirmed",
  );
  const transaction = Transaction.from(Buffer.from(transactionBase64, "base64"));
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");

  transaction.recentBlockhash = latestBlockhash.blockhash;

  transaction.partialSign(keypair);

  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: unsignedTransaction.sendTo === "ephemeral",
  });
  await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed",
  );

  return signature;
}

export async function buildAgentMicropayment(
  input: PrivateTransferInput,
): Promise<MicropaymentRecord> {
  const config = getHydraMagicBlockConfig();
  const mint = input.mint ?? config.treasuryMint;
  const result = await tryJsonFetch<TransactionBuildResponse>(
    `${config.paymentsApiUrl}/v1/spl/transfer`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: input.fromPubkey,
        to: input.toPubkey,
        mint,
        amount: input.amount,
        visibility: "private",
        fromBalance: "ephemeral",
        toBalance: "ephemeral",
        cluster: config.cluster,
        validator: config.validator.toBase58(),
        initIfMissing: true,
        initAtasIfMissing: true,
        initVaultIfMissing: true,
        memo: input.memo,
        split: 1,
        minDelayMs: "0",
        maxDelayMs: "0",
      }),
    },
  );

  const transactionSignature = await sendUnsignedTransaction(result, result.transactionBase64);

  return {
    from: input.from,
    to: input.to,
    amount: input.amount,
    visibility: "private",
    mint,
    status: "submitted",
    memo: input.memo,
    transactionBase64: result.transactionBase64,
    route: result.sendTo,
    validator: result.validator,
    transactionSignature,
  };
}
