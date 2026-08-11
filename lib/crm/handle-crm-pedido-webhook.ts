import {
  isEligiblePedidoPayload,
  upsertTasksFromPedido,
  type UpsertTasksFromPedidoResult,
} from "@/lib/crm/upsert-tasks-from-pedido";
import { verifyWebhookSignature } from "@/lib/crm/verify-webhook-signature";
import { crmPedidoWebhookSchema } from "@/lib/schemas/crm-pedido-webhook";

export type WebhookHandlerStatus = 200 | 400 | 401 | 500;

export type WebhookHandlerResult = {
  status: WebhookHandlerStatus;
  body: Record<string, unknown>;
  revalidateTasks?: boolean;
};

export async function processCrmPedidoWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Promise<WebhookHandlerResult> {
  if (!verifyWebhookSignature(rawBody, signatureHeader, secret)) {
    return { status: 401, body: { error: "unauthorized" } };
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: { error: "invalid_json" } };
  }

  const parsed = crmPedidoWebhookSchema.safeParse(json);
  if (!parsed.success) {
    return { status: 400, body: { error: "invalid_payload" } };
  }

  if (!isEligiblePedidoPayload(parsed.data)) {
    return { status: 200, body: { status: "skipped", reason: "no_bpedido" } };
  }

  try {
    const result: UpsertTasksFromPedidoResult = await upsertTasksFromPedido(
      parsed.data,
    );
    return {
      status: 200,
      body: { status: "ok", ...result },
      revalidateTasks: result.created > 0 || result.updated > 0,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return {
      status: 500,
      body: {
        error: "processing_failed",
        ...(process.env.NODE_ENV === "development" ? { detail: message } : {}),
      },
    };
  }
}
