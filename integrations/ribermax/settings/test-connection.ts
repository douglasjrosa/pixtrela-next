import type { RibermaxConnection } from "./connection-repo";

const PROBE_TIMEOUT_MS = 15_000;
const RBX_HANDSHAKE_PATH = "/handshake";

/**
 * Probes the legacy RBX handshake. Success only when Token is accepted (2xx).
 */
export async function probeRibermaxConnection(
  connection: RibermaxConnection,
): Promise<boolean> {
  const baseUrl = connection.baseUrl.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${RBX_HANDSHAKE_PATH}`, {
      method: "GET",
      headers: {
        Token: connection.token,
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
