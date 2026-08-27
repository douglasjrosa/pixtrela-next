import type { BoxTemplateData } from "./rbx-types";
import { isLegacyErrorResponse } from "./rbx-types";
import { getRibermaxConnection } from "@/integrations/ribermax/settings/connection-repo";

const DEFAULT_TIMEOUT_MS = 55_000;

function isBoxTemplateData(value: unknown): value is BoxTemplateData {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.prodId === "number" &&
    typeof record.empresaNome === "string" &&
    typeof record.boxName === "string" &&
    Array.isArray(record.subtasks)
  );
}

/**
 * Fetches box template data from the legacy RBX system using DB credentials.
 */
export async function fetchBoxTemplateData(
  boxId: number,
): Promise<BoxTemplateData> {
  const connection = await getRibermaxConnection();
  if (!connection) {
    throw new Error("ribermaxMisconfigured");
  }

  const url = connection.baseUrl.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${url}/produtos?templateData=${boxId}`, {
      method: "GET",
      headers: { Token: connection.token, Accept: "application/json" },
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
    const message = isLegacyErrorResponse(data)
      ? data.error
      : `Legacy RBX request failed (${response.status}).`;
    throw new Error(message);
  }

  if (isLegacyErrorResponse(data)) {
    throw new Error(data.error);
  }

  if (!isBoxTemplateData(data)) {
    throw new Error("Invalid box template payload from the legacy RBX system.");
  }

  return data;
}
