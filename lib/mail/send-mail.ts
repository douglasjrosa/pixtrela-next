import nodemailer from "nodemailer";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
};

function parseSmtpSecure(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function readSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const from = process.env.FROM_EMAIL?.trim();

  if (!host || !portRaw || !from) {
    return null;
  }

  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0) {
    return null;
  }

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  return {
    host,
    port,
    secure: parseSmtpSecure(process.env.SMTP_SECURE),
    from,
    user: user || undefined,
    pass: pass || undefined,
  };
}

export async function sendMail(input: SendMailInput): Promise<void> {
  const smtp = readSmtpConfig();

  if (!smtp) {
    console.info(
      "[mail] SMTP is not configured; email was not sent.",
      JSON.stringify({ to: input.to, subject: input.subject }),
    );
    console.info("[mail] body:", input.text);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth:
      smtp.user && smtp.pass
        ? {
            user: smtp.user,
            pass: smtp.pass,
          }
        : undefined,
  });

  await transporter.sendMail({
    from: smtp.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
