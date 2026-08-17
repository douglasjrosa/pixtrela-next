import nodemailer from "nodemailer";

import {
  MailConfigurationError,
  getMissingSmtpEnvVars,
  readSmtpConfig,
} from "@/lib/mail/smtp-config";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendMail(input: SendMailInput): Promise<void> {
  const missing = getMissingSmtpEnvVars();
  if (missing.length > 0) {
    throw new MailConfigurationError(missing);
  }

  const smtp = readSmtpConfig();
  if (!smtp) {
    throw new MailConfigurationError(["SMTP_PORT"]);
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
    ...(smtp.port === 587 && !smtp.secure ? { requireTLS: true } : {}),
  });

  try {
    await transporter.sendMail({
      from: smtp.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(
      "[mail] SMTP delivery failed.",
      JSON.stringify({ to: input.to, subject: input.subject, detail }),
    );
    throw error;
  }
}
