import {
  isEligiblePedidoPayload,
  upsertTasksFromPedido,
  type UpsertTasksFromPedidoResult,
} from "@/lib/crm/upsert-tasks-from-pedido";
import { crmWebhookLog } from "@/lib/crm/webhook-logger";
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
  requestId = "unknown",
): Promise<WebhookHandlerResult> {
  if (!verifyWebhookSignature(rawBody, signatureHeader, secret)) {
    crmWebhookLog.warn("signature_invalid", {
      requestId,
      signatureHeader: signatureHeader ?? "null",
      bodyBytes: rawBody.length,
    });
    return { status: 401, body: { error: "unauthorized" } };
  }

  crmWebhookLog.info("signature_valid", { requestId });

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_json";
    crmWebhookLog.warn("invalid_json", { requestId, message });
    return { status: 400, body: { error: "invalid_json" } };
  }

  const parsed = crmPedidoWebhookSchema.safeParse(json);
  if (!parsed.success) {
    crmWebhookLog.warn("invalid_payload", {
      requestId,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return { status: 400, body: { error: "invalid_payload" } };
  }

  crmWebhookLog.info("payload_parsed", {
    requestId,
    pedidoId: parsed.data.pedidoId,
    Bpedido: parsed.data.Bpedido,
    empresaNome: parsed.data.empresaNome,
    dataEntrega: parsed.data.dataEntrega ?? null,
    itensType: Array.isArray(parsed.data.itens)
      ? "array"
      : typeof parsed.data.itens,
  });

  if (!isEligiblePedidoPayload(parsed.data)) {
    crmWebhookLog.info("skipped_no_bpedido", {
      requestId,
      pedidoId: parsed.data.pedidoId,
      Bpedido: parsed.data.Bpedido,
    });
    return { status: 200, body: { status: "skipped", reason: "no_bpedido" } };
  }

  try {
    crmWebhookLog.info("upsert_started", {
      requestId,
      pedidoId: parsed.data.pedidoId,
      Bpedido: parsed.data.Bpedido,
    });

    const result: UpsertTasksFromPedidoResult = await upsertTasksFromPedido(
      parsed.data,
      requestId,
    );

    crmWebhookLog.info("upsert_completed", {
      requestId,
      pedidoId: parsed.data.pedidoId,
      ...result,
    });

    return {
      status: 200,
      body: { status: "ok", ...result },
      revalidateTasks: result.created > 0 || result.updated > 0,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    const stack = error instanceof Error ? error.stack : undefined;
    crmWebhookLog.error("processing_failed", {
      requestId,
      message,
      stack,
    });
    return {
      status: 500,
      body: {
        error: "processing_failed",
        detail: message,
      },
    };
  }
}
