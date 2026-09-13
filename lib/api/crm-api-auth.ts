import { getCrmWebhookSecret } from "@/integrations/crm/settings/repo";

export const CRM_API_TOKEN_HEADER = "Token";

export type CrmApiAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; error: "unauthorized" | "misconfigured" };

/**
 * Validates inbound CRM API calls using the shared CRM integration secret.
 */
export async function verifyCrmApiToken(
  request: Request,
): Promise<CrmApiAuthResult> {
  const secret = await getCrmWebhookSecret();
  if (!secret?.trim()) {
    return { ok: false, status: 500, error: "misconfigured" };
  }

  const token = request.headers.get(CRM_API_TOKEN_HEADER)?.trim() ?? "";
  if (!token || token !== secret) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  return { ok: true };
}
