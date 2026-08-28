import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { getCrmWebhookSecret } from "@/integrations/crm/settings/repo";
import { processCrmPedidoWebhook } from "@/integrations/ribermax";
import { CRM_WEBHOOK_SIGNATURE_HEADER } from "@/integrations/ribermax/crm/crm-webhook-http";

export const runtime = "nodejs";

async function getWebhookSecret(): Promise<string> {
  const secret = await getCrmWebhookSecret();
  if (!secret) {
    throw new Error("CRM webhook secret is not configured.");
  }
  return secret;
}

export async function POST(request: Request): Promise<NextResponse> {
  let secret: string;
  try {
    secret = await getWebhookSecret();
  } catch {
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get(CRM_WEBHOOK_SIGNATURE_HEADER);
  const result = await processCrmPedidoWebhook(rawBody, signature, secret);

  if (result.revalidateTasks) {
    revalidateTag("drizzle:tasks", "default");
    revalidateTag("drizzle:steps", "default");
    revalidatePath("/board");
    revalidatePath("/tasks");
  }

  return NextResponse.json(result.body, { status: result.status });
}
