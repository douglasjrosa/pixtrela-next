"use server";

import { getAppBaseUrl } from "@/lib/app/app-base-url";
import { isDeliverableEmail } from "@/lib/mail/deliverable-email";
import { buildPasswordResetEmail } from "@/lib/mail/password-reset-email";
import { sendMail } from "@/lib/mail/send-mail";
import {
  createPasswordResetToken,
  markPasswordResetTokenUsed,
  revokePasswordResetTokensForUser,
  verifyPasswordResetToken,
} from "@/lib/repos/password-reset";
import { findUserByEmail, updateUserAccount } from "@/lib/repos/users";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/schemas/password-reset";


export type RequestPasswordResetResult =
  | { ok: true }
  | { ok: false; error: "invalidEmail" | "mailUnavailable" };

export async function requestPasswordReset(
  raw: unknown,
): Promise<RequestPasswordResetResult> {
  const parsed = requestPasswordResetSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "invalidEmail" };
  }

  const email = parsed.data.email;
  if (!isDeliverableEmail(email)) {
    return { ok: true };
  }

  const user = await findUserByEmail(email);
  if (!user || user.blocked || !user.active) {
    return { ok: true };
  }

  const token = await createPasswordResetToken(user.id);
  const resetUrl = `${getAppBaseUrl()}/login/reset-password?token=${encodeURIComponent(token)}`;
  const { text, html } = buildPasswordResetEmail(resetUrl);

  try {
    await sendMail({
      to: email,
      subject: "Redefinição de senha",
      text,
      html,
    });
  } catch (error) {
    await revokePasswordResetTokensForUser(user.id);
    console.error("[password-reset] failed to send reset email", error);
    return { ok: false, error: "mailUnavailable" };
  }

  return { ok: true };
}

export type ResetPasswordResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "expired" | "passwordMismatch" };

export async function resetPassword(raw: unknown): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const passwordMismatch = parsed.error.issues.some(
      (issue) => issue.message === "passwordMismatch",
    );
    if (passwordMismatch) {
      return { ok: false, error: "passwordMismatch" };
    }
    return { ok: false, error: "invalid" };
  }

  const userId = await verifyPasswordResetToken(parsed.data.token);
  if (!userId) {
    return { ok: false, error: "expired" };
  }

  await updateUserAccount({
    id: userId,
    password: parsed.data.password,
  });
  await markPasswordResetTokenUsed(parsed.data.token);

  return { ok: true };
}

export async function verifyPasswordResetTokenAction(
  token: string,
): Promise<boolean> {
  if (!token.trim()) return false;
  const userId = await verifyPasswordResetToken(token);
  return Boolean(userId);
}
