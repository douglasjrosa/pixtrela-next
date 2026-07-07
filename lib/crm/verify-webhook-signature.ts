import { createHmac, timingSafeEqual } from "crypto";

const SIGNATURE_PREFIX = "sha256=";

export function signWebhookPayload(body: string, secret: string): string {
  const digest = createHmac("sha256", secret).update(body).digest("hex");
  return `${SIGNATURE_PREFIX}${digest}`;
}

export function verifyWebhookSignature(
  body: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader?.startsWith(SIGNATURE_PREFIX)) return false;

  const expected = signWebhookPayload(body, secret);
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signatureHeader);

  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}
