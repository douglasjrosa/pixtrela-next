import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { processCrmPedidoWebhook } from "@/lib/crm/handle-crm-pedido-webhook";

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
  let secret: string;
  try {
    secret = getWebhookSecret();
  } catch {
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get(CRM_SIGNATURE_HEADER);
  const result = await processCrmPedidoWebhook(rawBody, signature, secret);

  if (result.revalidateTasks) {
    revalidateTag("drizzle:tasks", "default");
    revalidateTag("drizzle:steps", "default");
    revalidatePath("/board");
    revalidatePath("/tasks");
  }

  return NextResponse.json(result.body, { status: result.status });
}
