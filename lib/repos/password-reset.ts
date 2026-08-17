import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, isNull } from "drizzle-orm";

import { passwordResetTokens } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(
  userId: string,
  nowMs = Date.now(),
  db: Db = getDb(),
): Promise<string> {
  const plainToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(nowMs + PASSWORD_RESET_TTL_MS);

  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));

  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return plainToken;
}

export async function verifyPasswordResetToken(
  plainToken: string,
  nowMs = Date.now(),
  db: Db = getDb(),
): Promise<string | null> {
  const tokenHash = hashToken(plainToken);
  const [row] = await db
    .select({ userId: passwordResetTokens.userId })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date(nowMs)),
      ),
    )
    .limit(1);
  return row?.userId ?? null;
}

export async function markPasswordResetTokenUsed(
  plainToken: string,
  db: Db = getDb(),
): Promise<void> {
  const tokenHash = hashToken(plainToken);
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.tokenHash, tokenHash));
}

export async function revokePasswordResetTokensForUser(
  userId: string,
  db: Db = getDb(),
): Promise<void> {
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));
}
