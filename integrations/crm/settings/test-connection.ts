import {
  buildCrmConnectionProbeBody,
  CRM_PEDIDO_WEBHOOK_PATH,
  CRM_WEBHOOK_SIGNATURE_HEADER,
} from "@/integrations/ribermax/crm/crm-webhook-http";
import { signWebhookPayload } from "@/integrations/ribermax/crm/verify-webhook-signature";
import { getAppBaseUrl } from "@/lib/app/app-base-url";

const PROBE_TIMEOUT_MS = 15_000;

export async function probeCrmWebhookSecret(secret: string): Promise<boolean> {
  const body = buildCrmConnectionProbeBody();
  const signature = signWebhookPayload(body, secret);
  const baseUrl = getAppBaseUrl().replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${CRM_PEDIDO_WEBHOOK_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [CRM_WEBHOOK_SIGNATURE_HEADER]: signature,
      },
      body,
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
