import { access, readFile } from "node:fs/promises";

import type { Wallet } from "@coral-xyz/anchor";
import { Keypair, Transaction, type PublicKey, type VersionedTransaction } from "@solana/web3.js";
import nacl from "tweetnacl";

import { resolveMaybeWorkspaceRelative } from "./workspacePaths";

const DEFAULT_KEYPAIR_CANDIDATES = [
  process.env.HYDRASLEUTH_AUTHORITY_KEYPAIR_PATH,
  ".wallets/provider.json",
  ".wallets/deployer.json",
].filter((candidate): candidate is string => Boolean(candidate));

async function canRead(pathname: string) {
  try {
    await access(pathname);
    return true;
  } catch {
    return false;
  }
}

async function resolveKeypairPath() {
  for (const candidate of DEFAULT_KEYPAIR_CANDIDATES) {
    const absolutePath = resolveMaybeWorkspaceRelative(candidate);
    if (await canRead(absolutePath)) {
      return absolutePath;
    }
  }

  throw new Error(
    "HydraSleuth could not find an authority keypair. Set HYDRASLEUTH_AUTHORITY_KEYPAIR_PATH or place a funded keypair at .wallets/provider.json.",
  );
}

export async function loadAuthorityKeypair() {
  if (process.env.HYDRASLEUTH_AUTHORITY_KEYPAIR_JSON) {
    let secretKey: number[];
    try {
      secretKey = JSON.parse(process.env.HYDRASLEUTH_AUTHORITY_KEYPAIR_JSON) as number[];
      return {
        keypairPath: "ENV: HYDRASLEUTH_AUTHORITY_KEYPAIR_JSON",
        keypair: Keypair.fromSecretKey(Uint8Array.from(secretKey)),
      };
    } catch (e) {
      console.warn("Failed to parse HYDRASLEUTH_AUTHORITY_KEYPAIR_JSON environment variable.");
    }
  }

  const keypairPath = await resolveKeypairPath();
  const secretKey = JSON.parse(await readFile(keypairPath, "utf8")) as number[];

  return {
    keypairPath,
    keypair: Keypair.fromSecretKey(Uint8Array.from(secretKey)),
  };
}

export function signMessageWithKeypair(
  publicKey: PublicKey,
  secretKey: Uint8Array,
  message: Uint8Array,
) {
  if (secretKey.length === 0) {
    throw new Error(`Missing signing material for ${publicKey.toBase58()}.`);
  }

  return nacl.sign.detached(message, secretKey);
}

export class KeypairWallet implements Wallet {
  constructor(readonly payer: Keypair) {}

  get publicKey() {
    return this.payer.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T) {
    if (transaction instanceof Transaction) {
      transaction.partialSign(this.payer);
      return transaction;
    }

    transaction.sign([this.payer]);
    return transaction;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]) {
    return Promise.all(transactions.map((transaction) => this.signTransaction(transaction)));
  }
}
