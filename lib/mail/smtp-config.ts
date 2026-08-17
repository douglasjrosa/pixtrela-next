export const SMTP_ENV_KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "FROM_EMAIL",
] as const;

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

function parseSmtpSecure(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function resolveSecure(port: number, explicit: string | undefined): boolean {
  if (explicit?.trim()) {
    return parseSmtpSecure(explicit);
  }
  return port === 465;
}

export function getMissingSmtpEnvVars(): string[] {
  const missing: string[] = [];
  if (!process.env.SMTP_HOST?.trim()) missing.push("SMTP_HOST");
  if (!process.env.SMTP_PORT?.trim()) missing.push("SMTP_PORT");
  if (!process.env.SMTP_USER?.trim()) missing.push("SMTP_USER");
  if (!process.env.SMTP_PASS?.trim()) missing.push("SMTP_PASS");
  if (!process.env.FROM_EMAIL?.trim()) missing.push("FROM_EMAIL");
  return missing;
}

export function readSmtpConfig(): SmtpConfig | null {
  const missing = getMissingSmtpEnvVars();
  if (missing.length > 0) {
    return null;
  }

  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT!.trim());
  if (!Number.isInteger(port) || port <= 0) {
    return null;
  }

  return {
    host,
    port,
    secure: resolveSecure(port, process.env.SMTP_SECURE),
    user: process.env.SMTP_USER!.trim(),
    pass: process.env.SMTP_PASS!.trim(),
    from: process.env.FROM_EMAIL!.trim(),
  };
}

export class MailConfigurationError extends Error {
  readonly missingEnvVars: string[];

  constructor(missingEnvVars: string[]) {
    super(
      `SMTP is not configured. Missing environment variables: ${missingEnvVars.join(", ")}`,
    );
    this.name = "MailConfigurationError";
    this.missingEnvVars = missingEnvVars;
  }
}
