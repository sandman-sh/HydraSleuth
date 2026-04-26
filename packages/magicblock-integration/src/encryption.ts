import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import type { AgentRole, EncryptedHandoffRecord } from "@hydrasleuth/shared";

function deriveSessionKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

export function encryptAgentHandoff(
  payload: string,
  secret: string,
  from: AgentRole,
  to: AgentRole,
): EncryptedHandoffRecord {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveSessionKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    from,
    to,
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    createdAt: new Date().toISOString(),
  };
}

export function decryptAgentHandoff(handoff: EncryptedHandoffRecord, secret: string): string {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    deriveSessionKey(secret),
    Buffer.from(handoff.iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(handoff.authTag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(handoff.ciphertext, "base64")),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

