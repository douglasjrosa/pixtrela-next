import type { CrmConnection } from "./schema";

const PROBE_TIMEOUT_MS = 15_000;
const CRM_HANDSHAKE_PATH = "/api/pixtrela/handshake";

/**
 * Probes the CRM (sys-rbx-frontend) handshake with the shared webhook secret.
 * Success only when the remote validates Token and returns HTTP 2xx.
 */
export async function probeCrmWebhookSecret(
  connection: CrmConnection,
): Promise<boolean> {
  const baseUrl = connection.baseUrl.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${CRM_HANDSHAKE_PATH}`, {
      method: "GET",
      headers: {
        Token: connection.webhookSecret,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
