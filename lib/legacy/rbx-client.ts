import type { BoxTemplateData, LegacyErrorResponse } from "./rbx-types";

const DEFAULT_TIMEOUT_MS = 55_000;

function getLegacyConfig(): { url: string; token: string } {
  const url = process.env.LEGACY_RBX_URL;
  const token = process.env.LEGACY_RBX_TOKEN;
  if (!url || !token) {
    throw new Error("LEGACY_RBX_URL and LEGACY_RBX_TOKEN must be set.");
  }
  return { url: url.replace(/\/+$/, ""), token };
}

function isErrorResponse(value: unknown): value is LegacyErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as LegacyErrorResponse).error === "string"
  );
}

/**
 * Fetches a box's calcCx data and PHP-computed assembly counts from the legacy
 * RBX system, authenticating with the shared `Token` header.
 *
 * @param boxId Numeric product id (the template `code` in Pixtrela).
 */
export async function fetchBoxTemplateData(
  boxId: number,
): Promise<BoxTemplateData> {
  const { url, token } = getLegacyConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${url}/produtos?templateData=${boxId}`, {
      method: "GET",
      headers: { Token: token, Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Legacy RBX request timed out.");
    }
    throw new Error("Could not reach the legacy RBX system.");
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Invalid JSON response from the legacy RBX system.");
  }

  if (!response.ok) {
    const message = isErrorResponse(data)
      ? data.error
      : `Legacy RBX request failed (${response.status}).`;
    throw new Error(message);
  }

  if (isErrorResponse(data)) {
    throw new Error(data.error);
  }

  return data as BoxTemplateData;
}
