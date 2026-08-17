import { beforeEach, describe, expect, it, vi } from "vitest";

const createPasswordResetToken = vi.fn();
const markPasswordResetTokenUsed = vi.fn();
const verifyPasswordResetToken = vi.fn();
const findUserByEmail = vi.fn();
const updateUserAccount = vi.fn();
const sendMail = vi.fn();

vi.mock("@/lib/repos/password-reset", () => ({
  createPasswordResetToken: (...args: unknown[]) =>
    createPasswordResetToken(...args),
  markPasswordResetTokenUsed: (...args: unknown[]) =>
    markPasswordResetTokenUsed(...args),
  verifyPasswordResetToken: (...args: unknown[]) =>
    verifyPasswordResetToken(...args),
}));

vi.mock("@/lib/repos/users", () => ({
  findUserByEmail: (...args: unknown[]) => findUserByEmail(...args),
  updateUserAccount: (...args: unknown[]) => updateUserAccount(...args),
}));

vi.mock("@/lib/mail/send-mail", () => ({
  sendMail: (...args: unknown[]) => sendMail(...args),
}));

describe("password-reset-actions", () => {
  beforeEach(() => {
    vi.resetModules();
    createPasswordResetToken.mockReset();
    markPasswordResetTokenUsed.mockReset();
    verifyPasswordResetToken.mockReset();
    findUserByEmail.mockReset();
    updateUserAccount.mockReset();
    sendMail.mockReset();
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
  });

  it("requestPasswordReset sends mail for active users", async () => {
    findUserByEmail.mockResolvedValue({
      id: "u1",
      blocked: false,
      active: true,
    });
    createPasswordResetToken.mockResolvedValue("plain-token");

    const { requestPasswordReset } = await import("./password-reset-actions");
    const result = await requestPasswordReset({ email: "ana@example.com" });

    expect(result).toEqual({ ok: true });
    expect(createPasswordResetToken).toHaveBeenCalledWith("u1");
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ana@example.com",
        subject: "Redefinição de senha",
      }),
    );
  });

  it("requestPasswordReset returns ok without leaking missing users", async () => {
    findUserByEmail.mockResolvedValue(null);
    const { requestPasswordReset } = await import("./password-reset-actions");
    const result = await requestPasswordReset({ email: "missing@example.com" });
    expect(result).toEqual({ ok: true });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("resetPassword updates account and consumes token", async () => {
    verifyPasswordResetToken.mockResolvedValue("u1");
    const { resetPassword } = await import("./password-reset-actions");
    const result = await resetPassword({
      token: "plain-token",
      password: "newpass",
      passwordConfirmation: "newpass",
    });
    expect(result).toEqual({ ok: true });
    expect(updateUserAccount).toHaveBeenCalledWith({
      id: "u1",
      password: "newpass",
    });
    expect(markPasswordResetTokenUsed).toHaveBeenCalledWith("plain-token");
  });
});
