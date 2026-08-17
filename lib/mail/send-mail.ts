export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendMail(input: SendMailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.MAIL_FROM?.trim() ?? "noreply@example.com"; // pragma: allowlist secret

  if (!apiKey) {
    console.info(
      "[mail] RESEND_API_KEY is not set; email was not sent.",
      JSON.stringify({ to: input.to, subject: input.subject }),
    );
    console.info("[mail] body:", input.text);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`sendMail failed (${response.status}): ${detail}`);
  }
}
