

import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { GetCommitmentSignature } from "@magicblock-labs/ephemeral-rollups-sdk";
import { toProtocolInvestigationType, type InvestigationCaseRecord } from "@hydrasleuth/shared";
import { type AccountMeta, Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

import { createMagicBlockConnections, getHydraMagicBlockConfig } from "./config";
import { KeypairWallet, loadAuthorityKeypair } from "./runtimeWallet";
import { resolveWorkspacePath } from "./workspacePaths";

const MAGIC_PROGRAM_ID = new PublicKey("Magic11111111111111111111111111111111111111");
const MAGIC_CONTEXT_ID = new PublicKey("MagicContext1111111111111111111111111111111");

type HydraProgramStatus = {
  authority: string;
  authorityBalanceLamports: number;
  deployed: boolean;
  programId: string;
  treasury: string;
};

import HydraIdl from "./idl.json";

async function loadHydraIdl() {
  return HydraIdl as Idl & { address?: string };
}

async function createProgramProvider() {
  const { keypair } = await loadAuthorityKeypair();
  const { baseConnection } = createMagicBlockConnections();

  return new AnchorProvider(baseConnection, new KeypairWallet(keypair), {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
}

async function createEphemeralProgramProvider(ephemeralRpcUrl: string) {
  const { keypair } = await loadAuthorityKeypair();

  return new AnchorProvider(new Connection(ephemeralRpcUrl, "confirmed"), new KeypairWallet(keypair), {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
}

export async function getHydraProgramClient() {
  const idl = await loadHydraIdl();
  const provider = await createProgramProvider();
  const configuredProgramId = process.env.HYDRASLEUTH_PROGRAM_ID ?? idl.address;

  if (!configuredProgramId) {
    throw new Error("HydraSleuth could not resolve a program ID from the generated IDL.");
  }

  const programId = new PublicKey(configuredProgramId);
  const program = new Program(
    {
      ...idl,
      address: programId.toBase58(),
    },
    provider,
  );

  return { provider, program, programId };
}

async function getHydraEphemeralProgramClient(ephemeralRpcUrl: string) {
  const idl = await loadHydraIdl();
  const provider = await createEphemeralProgramProvider(ephemeralRpcUrl);
  const configuredProgramId = process.env.HYDRASLEUTH_PROGRAM_ID ?? idl.address;

  if (!configuredProgramId) {
    throw new Error("HydraSleuth could not resolve a program ID from the generated IDL.");
  }

  const programId = new PublicKey(configuredProgramId);
  const program = new Program(
    {
      ...idl,
      address: programId.toBase58(),
    },
    provider,
  );

  return { provider, program, programId };
}

export async function getHydraProgramStatus(): Promise<HydraProgramStatus> {
  const { provider, programId } = await getHydraProgramClient();
  const treasury = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), provider.publicKey.toBuffer()],
    programId,
  )[0];
  const [programInfo, balance] = await Promise.all([
    provider.connection.getAccountInfo(programId),
    provider.connection.getBalance(provider.publicKey),
  ]);

  return {
    authority: provider.publicKey.toBase58(),
    authorityBalanceLamports: balance,
    deployed: Boolean(programInfo?.executable),
    programId: programId.toBase58(),
    treasury: treasury.toBase58(),
  };
}

async function assertProgramDeployed() {
  const status = await getHydraProgramStatus();

  if (status.deployed) {
    return status;
  }

  throw new Error(
    `HydraSleuth program ${status.programId} is built but not deployed on devnet. The current authority wallet has ${status.authorityBalanceLamports} lamports; deploying this build previously required about 2302124400 lamports.`,
  );
}

export async function ensureHydraTreasuryInitialized() {
  const status = await assertProgramDeployed();
  const { provider, program } = await getHydraProgramClient();
  const methods = program.methods as any;
  const treasuryPublicKey = new PublicKey(status.treasury);
  const existingTreasury = await provider.connection.getAccountInfo(treasuryPublicKey);

  if (existingTreasury) {
    return treasuryPublicKey;
  }

  const config = getHydraMagicBlockConfig();
  await methods
    .initializeTreasury(new PublicKey(config.treasuryMint))
    .accounts({
      authority: provider.publicKey,
      treasury: treasuryPublicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return treasuryPublicKey;
}

export function findCaseRecordPda(caseId: string, programId: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from("case"), Buffer.from(caseId)], programId)[0];
}

export function findCaseBufferPda(caseRecord: PublicKey, programId: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from("buffer"), caseRecord.toBuffer()], programId)[0];
}

function toL1SessionReference(privateSessionUri: string) {
  try {
    const parsed = new URL(privateSessionUri);
    const sessionId = parsed.searchParams.get("session");

    if (sessionId) {
      return `per://${sessionId}`;
    }
  } catch {
    // Fall through to the bounded string path below.
  }

  return privateSessionUri.slice(0, 120);
}

export async function submitCaseToL1(caseRecord: InvestigationCaseRecord, privateSessionUri: string) {
  const treasury = await ensureHydraTreasuryInitialized();
  const { provider, program, programId } = await getHydraProgramClient();
  const methods = program.methods as any;
  const caseRecordPda = findCaseRecordPda(caseRecord.caseId, programId);
  const l1SessionReference = toL1SessionReference(privateSessionUri);
  const protocolInvestigationType = toProtocolInvestigationType(caseRecord.investigationType);

  const signature = await methods
    .submitCase(
      caseRecord.caseId,
      protocolInvestigationType,
      caseRecord.subject,
      l1SessionReference,
    )
    .accounts({
      requester: provider.publicKey,
      treasury,
      caseRecord: caseRecordPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return {
    caseRecordPda: caseRecordPda.toBase58(),
    signature,
    treasury: treasury.toBase58(),
  };
}

export async function markCaseInvestigatingOnL1(caseId: string) {
  const { program, programId } = await getHydraProgramClient();
  const methods = program.methods as any;
  const treasury = await ensureHydraTreasuryInitialized();
  const caseRecord = findCaseRecordPda(caseId, programId);

  return methods
    .markCaseInvestigating()
    .accounts({
      payer: program.provider.publicKey,
      caseRecord,
      treasury,
    })
    .rpc();
}

export async function delegateCaseStateOnL1(caseId: string) {
  const { program, programId } = await getHydraProgramClient();
  const methods = program.methods as any;
  const caseRecord = findCaseRecordPda(caseId, programId);
  const validator = getHydraMagicBlockConfig().validator;

  return methods
    .delegateCaseState(caseId)
    .accounts({
      payer: program.provider.publicKey,
      validator,
      caseRecord,
    })
    .rpc();
}

export async function settleCaseOnL1(
  caseId: string,
  sanitizedSummary: string,
  attestationHash: string,
  riskScore: number,
) {
  const { program, programId } = await getHydraProgramClient();
  const methods = program.methods as any;
  const treasury = await ensureHydraTreasuryInitialized();
  const caseRecord = findCaseRecordPda(caseId, programId);

  return methods
    .settleReport(sanitizedSummary, attestationHash, riskScore)
    .accounts({
      authority: program.provider.publicKey,
      treasury,
      caseRecord,
    })
    .rpc();
}

export async function undelegateCaseStateInRollup(caseId: string, ephemeralRpcUrl: string) {
  const { provider, program, programId } = await getHydraEphemeralProgramClient(ephemeralRpcUrl);
  const methods = program.methods as any;
  const caseRecord = findCaseRecordPda(caseId, programId);
  const instruction = await methods
    .undelegateCaseState()
    .accounts({
      payer: program.provider.publicKey,
      caseRecord,
      magicProgram: MAGIC_PROGRAM_ID,
      magicContext: MAGIC_CONTEXT_ID,
    })
    .instruction();
  const { keypair } = await loadAuthorityKeypair();
  const latestBlockhash = await provider.connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({
    feePayer: provider.publicKey,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  }).add(instruction);

  transaction.partialSign(keypair);

  const signature = await provider.connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: true,
  });
  await provider.connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed",
  );

  const baseCommitSignature = await GetCommitmentSignature(signature, provider.connection);

  return {
    ephemeralSignature: signature,
    baseCommitSignature,
  };
}

export async function waitForCaseOwnershipOnL1(caseId: string, expectedOwner?: PublicKey) {
  const { provider, programId } = await getHydraProgramClient();
  const caseRecord = findCaseRecordPda(caseId, programId);
  const targetOwner = expectedOwner ?? programId;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const accountInfo = await provider.connection.getAccountInfo(caseRecord, "confirmed");

    if (accountInfo?.owner.equals(targetOwner)) {
      return caseRecord;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error(
    `Timed out waiting for case ${caseId} to return to owner ${targetOwner.toBase58()} on Solana L1.`,
  );
}

export async function processUndelegationOnL1(caseId: string) {
  const { provider, program, programId } = await getHydraProgramClient();
  const methods = program.methods as any;
  const caseRecord = findCaseRecordPda(caseId, programId);
  const buffer = findCaseBufferPda(caseRecord, programId);
  const instruction = await methods
    .processUndelegation([Buffer.from("case"), Buffer.from(caseId)])
    .accounts({
      baseAccount: caseRecord,
      buffer,
      payer: program.provider.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  instruction.keys = instruction.keys.map((accountMeta: AccountMeta) =>
    accountMeta.pubkey.equals(provider.publicKey)
      ? { ...accountMeta, isSigner: true, isWritable: true }
      : accountMeta,
  );
  const { keypair } = await loadAuthorityKeypair();
  const latestBlockhash = await provider.connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({
    feePayer: provider.publicKey,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  }).add(instruction);

  transaction.partialSign(keypair);

  const signature = await provider.connection.sendRawTransaction(transaction.serialize());
  await provider.connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed",
  );

  return signature;
}
