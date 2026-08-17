import { describe, expect, it } from "vitest";

import { buildPasswordResetEmail } from "@/lib/mail/password-reset-email";

describe("buildPasswordResetEmail", () => {
  it("includes brand branding and reset link", () => {
    const resetUrl =
      "https://app.example.com/login/reset-password?token=abc";
    const { text, html } = buildPasswordResetEmail(resetUrl);

    expect(text).toContain("Você produz. Você ganha. Você brilha.");
    expect(text).toContain("Recebemos um pedido para redefinir sua senha.");
    expect(text).toContain(resetUrl);
    expect(text).toContain("Se você não solicitou isso, ignore este e-mail.");

    expect(html).toContain("<strong>PIXTRELA</strong>"); // pragma: allowlist secret
    expect(html).toContain(`href="${resetUrl}"`);
    expect(html).toContain("Redefinir senha");
  });
});
