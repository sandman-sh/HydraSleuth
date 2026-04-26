import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { getMint } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import { getHydraMagicBlockConfig } from "@hydrasleuth/magicblock-integration";

export type TokenMetadataSummary = {
  name: string;
  symbol: string;
  sellerFeeBasisPoints: number;
  isMutable: boolean;
  hasFreezeAuthority: boolean;
  hasMintAuthority: boolean;
  authorities: string[];
};

export async function fetchTokenMetadataSummary(mintAddress: string): Promise<TokenMetadataSummary> {
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? getHydraMagicBlockConfig().baseRpcUrl,
    "confirmed",
  );
  const publicKey = new PublicKey(mintAddress);
  let mint: any;
  try {
    mint = await getMint(connection, publicKey, "confirmed");
  } catch (err: any) {
    throw new Error(`Invalid Token Mint: ${err.message}`);
  }
  const metaplex = Metaplex.make(connection).use(keypairIdentity(Keypair.generate()));

  try {
    const nft = await metaplex.nfts().findByMint({ mintAddress: publicKey });

    return {
      name: nft.name,
      symbol: nft.symbol,
      sellerFeeBasisPoints: nft.sellerFeeBasisPoints,
      isMutable: nft.isMutable,
      hasFreezeAuthority: Boolean(mint.freezeAuthority),
      hasMintAuthority: Boolean(mint.mintAuthority),
      authorities: [nft.updateAuthorityAddress.toBase58()],
    };
  } catch {
    return {
      name: `Mint ${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)}`,
      symbol: "TOKEN",
      sellerFeeBasisPoints: 0,
      isMutable: false,
      hasFreezeAuthority: Boolean(mint.freezeAuthority),
      hasMintAuthority: Boolean(mint.mintAuthority),
      authorities: [
        mint.mintAuthority?.toBase58() ?? "mint-authority-burned",
        mint.freezeAuthority?.toBase58() ?? "freeze-authority-burned",
      ],
    };
  }
}
