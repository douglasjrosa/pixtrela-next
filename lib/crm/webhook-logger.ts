const LOG_PREFIX = "[crm-webhook]";

type LogLevel = "info" | "warn" | "error";

function serializeValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatFields(fields: Record<string, unknown>): string {
  return Object.entries(fields)
    .map(([key, value]) => `${key}=${serializeValue(value)}`)
    .join(" ");
}

function writeLog(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
): void {
  const line = `${LOG_PREFIX} event=${event} ${formatFields(fields)}`.trim();
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const crmWebhookLog = {
  info(event: string, fields: Record<string, unknown> = {}): void {
    writeLog("info", event, fields);
  },
  warn(event: string, fields: Record<string, unknown> = {}): void {
    writeLog("warn", event, fields);
  },
  error(event: string, fields: Record<string, unknown> = {}): void {
    writeLog("error", event, fields);
  },
};

export function summarizeSignatureHeader(signature: string | null): string {
  if (!signature) return "missing";
  if (signature.length <= 16) return "present(short)";
  return `present(${signature.slice(0, 16)}...)`;
}
