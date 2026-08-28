import type { RibermaxConnection } from "./connection-repo";

const PROBE_TIMEOUT_MS = 15_000;

export async function probeRibermaxConnection(
  connection: RibermaxConnection,
): Promise<boolean> {
  const baseUrl = connection.baseUrl.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/produtos?templateData=0`, {
      method: "GET",
      headers: {
        Token: connection.token,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      return false;
    }

    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
