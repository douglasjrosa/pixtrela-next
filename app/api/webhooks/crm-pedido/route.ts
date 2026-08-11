import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { processCrmPedidoWebhook } from "@/lib/crm/handle-crm-pedido-webhook";
import {
  crmWebhookLog,
  summarizeSignatureHeader,
} from "@/lib/crm/webhook-logger";

export const runtime = "nodejs";

const CRM_SIGNATURE_HEADER = `x-${"pix"}${"trela"}-signature`;

function getWebhookSecret(): string {
  const secret = process.env.CRM_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("CRM_WEBHOOK_SECRET must be set.");
  }
  return secret;
}

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const signature = request.headers.get(CRM_SIGNATURE_HEADER);

  crmWebhookLog.info("request_received", {
    requestId,
    method: request.method,
    url: request.url,
    signature: summarizeSignatureHeader(signature),
    contentType: request.headers.get("content-type"),
    userAgent: request.headers.get("user-agent"),
  });

  let secret: string;
  try {
    secret = getWebhookSecret();
    crmWebhookLog.info("secret_configured", {
      requestId,
      secretLength: secret.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "misconfigured";
    crmWebhookLog.error("misconfigured", { requestId, message });
    return NextResponse.json({ error: "misconfigured", requestId }, { status: 500 });
  }

  const rawBody = await request.text();
  crmWebhookLog.info("body_read", {
    requestId,
    bodyBytes: rawBody.length,
    bodyPreview: rawBody.slice(0, 200),
  });

  const result = await processCrmPedidoWebhook(
    rawBody,
    signature,
    secret,
    requestId,
  );

  if (result.revalidateTasks) {
    revalidateTag("drizzle:tasks", "default");
    revalidateTag("drizzle:steps", "default");
    crmWebhookLog.info("cache_revalidated", {
      requestId,
      tags: ["drizzle:tasks", "drizzle:steps"],
    });
  }

  crmWebhookLog.info("response_sent", {
    requestId,
    status: result.status,
    body: result.body,
  });

  return NextResponse.json(
    { ...result.body, requestId },
    { status: result.status },
  );
}
