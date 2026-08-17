const BRAND_NAME = "PIXTRELA"; // pragma: allowlist secret
const BRAND_TAGLINE = "Você produz. Você ganha. Você brilha.";

export function buildPasswordResetEmail(resetUrl: string): {
  text: string;
  html: string;
} {
  const text = [
    BRAND_NAME,
    BRAND_TAGLINE,
    "",
    "Recebemos um pedido para redefinir sua senha.",
    "",
    resetUrl,
    "",
    "Se você não solicitou isso, ignore este e-mail.",
  ].join("\n");

  const html = [
    `<p><strong>${BRAND_NAME}</strong><br />`,
    `${BRAND_TAGLINE}</p>`,
    "<p>Recebemos um pedido para redefinir sua senha.</p>",
    `<p><a href="${resetUrl}">Redefinir senha</a></p>`,
    "<p>Se você não solicitou isso, ignore este e-mail.</p>",
  ].join("");

  return { text, html };
}
