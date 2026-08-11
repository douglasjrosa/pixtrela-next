import { ensureTemplateTaskForProdId } from "@/lib/business/ensure-template-for-prod-id";
import { resolveDefaultStepDocumentId } from "@/lib/business/default-task-step";
import { getNextTaskIndex } from "@/lib/business/task-order";
import { mapPedidoToTaskDrafts } from "@/lib/crm/map-pedido-to-tasks";
import { crmWebhookLog } from "@/lib/crm/webhook-logger";
import { listSteps } from "@/lib/repos/steps";
import {
  createTask,
  findTaskByCrmItemKey,
  listActiveTasksForBoard,
  updateCrmPedidoTaskFields,
  type CrmPedidoTaskRecord,
} from "@/lib/repos/tasks";

export interface CrmPedidoWebhookPayload {
  pedidoId: number;
  Bpedido: string;
  itens: unknown;
  dataEntrega?: string | null;
  empresaNome: string;
}

export interface UpsertTasksFromPedidoResult {
  created: number;
  updated: number;
  skipped: number;
}

export function isEligiblePedidoPayload(payload: CrmPedidoWebhookPayload): boolean {
  return Boolean(payload.Bpedido?.trim());
}

async function loadDefaultStepId(requestId: string): Promise<string> {
  const steps = await listSteps();
  crmWebhookLog.info("steps_loaded", {
    requestId,
    stepCount: steps.length,
    stepNames: steps.map((step) => step.name),
  });

  const stepId = resolveDefaultStepDocumentId(
    steps.map((step) => ({ documentId: step.id, name: step.name })),
  );
  if (!stepId) {
    throw new Error("no_default_step");
  }

  crmWebhookLog.info("default_step_resolved", { requestId, stepId });
  return stepId;
}

async function loadTaskIndexes(requestId: string): Promise<number[]> {
  const rows = await listActiveTasksForBoard();
  const indexes = rows.map((task) => task.index);
  crmWebhookLog.info("task_indexes_loaded", {
    requestId,
    activeTaskCount: rows.length,
    maxIndex: indexes.length > 0 ? Math.max(...indexes) : null,
  });
  return indexes;
}

function taskNeedsUpdate(
  existing: CrmPedidoTaskRecord,
  draft: ReturnType<typeof mapPedidoToTaskDrafts>[number],
): boolean {
  return (
    existing.name !== draft.name ||
    existing.qty !== draft.qty ||
    (existing.deliveryDate ?? null) !== draft.deliveryDate
  );
}

/**
 * Creates or updates Pixtrela tasks from a CRM pedido webhook payload.
 * Idempotent via crmItemKey; does not deactivate orphaned tasks.
 */
export async function upsertTasksFromPedido(
  payload: CrmPedidoWebhookPayload,
  requestId = "unknown",
): Promise<UpsertTasksFromPedidoResult> {
  if (!isEligiblePedidoPayload(payload)) {
    return { created: 0, updated: 0, skipped: 0 };
  }

  const drafts = mapPedidoToTaskDrafts({
    id: payload.pedidoId,
    itens: payload.itens,
    dataEntrega: payload.dataEntrega ?? null,
    empresaNome: payload.empresaNome,
  });

  crmWebhookLog.info("drafts_mapped", {
    requestId,
    pedidoId: payload.pedidoId,
    draftCount: drafts.length,
    crmItemKeys: drafts.map((draft) => draft.crmItemKey),
    prodIds: drafts.map((draft) => draft.prodId),
  });

  if (drafts.length === 0) {
    crmWebhookLog.warn("no_drafts", {
      requestId,
      pedidoId: payload.pedidoId,
      itensType: Array.isArray(payload.itens)
        ? "array"
        : typeof payload.itens,
    });
    return { created: 0, updated: 0, skipped: 0 };
  }

  const defaultStepId = await loadDefaultStepId(requestId);
  const taskIndexes = await loadTaskIndexes(requestId);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const draft of drafts) {
    const existing = await findTaskByCrmItemKey(draft.crmItemKey);

    if (existing) {
      if (taskNeedsUpdate(existing, draft)) {
        await updateCrmPedidoTaskFields(existing.id, {
          name: draft.name,
          qty: draft.qty,
          deliveryDate: draft.deliveryDate,
        });
        crmWebhookLog.info("task_updated", {
          requestId,
          crmItemKey: draft.crmItemKey,
          taskId: existing.id,
        });
        updated += 1;
      } else {
        crmWebhookLog.info("task_unchanged", {
          requestId,
          crmItemKey: draft.crmItemKey,
          taskId: existing.id,
        });
        skipped += 1;
      }
      continue;
    }

    crmWebhookLog.info("template_ensure_started", {
      requestId,
      crmItemKey: draft.crmItemKey,
      prodId: draft.prodId,
    });
    await ensureTemplateTaskForProdId(draft.prodId, draft.name);
    const index = getNextTaskIndex(taskIndexes.map((value) => ({ index: value })));
    taskIndexes.push(index);
    const task = await createTask({
      name: draft.name,
      qty: draft.qty,
      deliveryDate: draft.deliveryDate,
      index,
      status: "waiting",
      templateTaskCode: draft.templateTaskCode,
      stepId: defaultStepId,
      crmPedidoId: draft.crmPedidoId,
      crmItemKey: draft.crmItemKey,
    });
    crmWebhookLog.info("task_created", {
      requestId,
      crmItemKey: draft.crmItemKey,
      taskId: task.id,
      index,
      templateTaskCode: draft.templateTaskCode,
      stepId: defaultStepId,
    });
    created += 1;
  }

  return { created, updated, skipped };
}
