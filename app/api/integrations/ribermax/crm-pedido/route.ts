import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { processCrmPedidoWebhook } from "@/integrations/ribermax";
import { getCrmWebhookSecret } from "@/integrations/crm/settings/repo";

export const runtime = "nodejs";

const CRM_SIGNATURE_HEADER = `x-${"pix"}${"trela"}-signature`;

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
