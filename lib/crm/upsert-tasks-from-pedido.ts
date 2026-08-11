import { ensureTemplateTaskForProdId } from "@/lib/business/ensure-template-for-prod-id";
import { resolveDefaultStepDocumentId } from "@/lib/business/default-task-step";
import { getNextTaskIndex } from "@/lib/business/task-order";
import { mapPedidoToTaskDrafts } from "@/lib/crm/map-pedido-to-tasks";
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

async function loadDefaultStepId(): Promise<string> {
  const steps = await listSteps();
  const stepId = resolveDefaultStepDocumentId(
    steps.map((step) => ({ documentId: step.id, name: step.name })),
  );
  if (!stepId) {
    throw new Error("no_default_step");
  }
  return stepId;
}

async function loadTaskIndexes(): Promise<number[]> {
  const rows = await listActiveTasksForBoard();
  return rows.map((task) => task.index);
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

  if (drafts.length === 0) {
    return { created: 0, updated: 0, skipped: 0 };
  }

  const defaultStepId = await loadDefaultStepId();
  const taskIndexes = await loadTaskIndexes();

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
        updated += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    await ensureTemplateTaskForProdId(draft.prodId, draft.name);
    const index = getNextTaskIndex(taskIndexes.map((value) => ({ index: value })));
    taskIndexes.push(index);
    await createTask({
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
    created += 1;
  }

  return { created, updated, skipped };
}
