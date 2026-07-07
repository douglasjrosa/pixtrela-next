import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { processCrmPedidoWebhook } from "@/lib/crm/handle-crm-pedido-webhook";
import { STRAPI_TAGS } from "@/lib/strapi";

export const runtime = "nodejs";

function getWebhookSecret(): string {
  const secret = process.env.CRM_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("CRM_WEBHOOK_SECRET must be set.");
  }
  return secret;
}

export async function POST(request: Request): Promise<NextResponse> {
  let secret: string;
  try {
    secret = getWebhookSecret();
  } catch {
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-pixtrela-signature");
  const result = await processCrmPedidoWebhook(rawBody, signature, secret);

  if (result.revalidateTasks) {
    revalidateTag(STRAPI_TAGS.tasks);
  }

  return NextResponse.json(result.body, { status: result.status });
}
