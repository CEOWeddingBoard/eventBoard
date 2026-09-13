import { createHash, randomBytes } from "crypto";

export function generateWeddingBoardToken(): string {
  return randomBytes(20).toString("base64url");
}

export function hashWeddingToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
