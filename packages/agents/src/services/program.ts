import { Connection, PublicKey } from "@solana/web3.js";

import { getHydraMagicBlockConfig } from "@hydrasleuth/magicblock-integration";

export type ProgramAccountSummary = {
  owner: string;
  executable: boolean;
  lamports: number;
  dataLength: number;
};

export async function fetchProgramAccountSummary(programAddress: string): Promise<ProgramAccountSummary> {
  const connection = new Connection(getHydraMagicBlockConfig().baseRpcUrl, "confirmed");
  const accountInfo = await connection.getAccountInfo(new PublicKey(programAddress), "confirmed");

  if (!accountInfo) {
    throw new Error(`Program account ${programAddress} was not found on ${connection.rpcEndpoint}.`);
  }

  return {
    owner: accountInfo.owner.toBase58(),
    executable: accountInfo.executable,
    lamports: accountInfo.lamports,
    dataLength: accountInfo.data.length,
  };
}

export type WalletAccountSummary = {
  address: string;
  lamports: number;
  solBalance: number;
  executable: boolean;
  owner: string;
};

export async function fetchWalletAccountSummary(walletAddress: string): Promise<WalletAccountSummary> {
  const connection = new Connection(getHydraMagicBlockConfig().baseRpcUrl, "confirmed");
  const pubkey = new PublicKey(walletAddress);
  const accountInfo = await connection.getAccountInfo(pubkey, "confirmed");

  if (!accountInfo) {
    return {
      address: walletAddress,
      lamports: 0,
      solBalance: 0,
      executable: false,
      owner: "11111111111111111111111111111111" // System Program
    };
  }

  return {
    address: walletAddress,
    lamports: accountInfo.lamports,
    solBalance: accountInfo.lamports / 1e9,
    executable: accountInfo.executable,
    owner: accountInfo.owner.toBase58(),
  };
}
