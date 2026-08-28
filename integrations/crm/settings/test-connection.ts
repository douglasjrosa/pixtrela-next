import {
  signWebhookPayload,
  verifyWebhookSignature,
} from "@/integrations/ribermax/crm/verify-webhook-signature";

const PROBE_BODY = "{}";

export function probeCrmWebhookSecret(secret: string): boolean {
  const signature = signWebhookPayload(PROBE_BODY, secret);
  return verifyWebhookSignature(PROBE_BODY, signature, secret);
}
