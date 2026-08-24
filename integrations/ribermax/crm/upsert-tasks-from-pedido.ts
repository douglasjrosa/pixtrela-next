import { ensureTemplateTaskForProdId } from "@/integrations/ribermax/box/ensure-template-for-prod-id";
import {
  mapPedidoToTaskDrafts,
  toExternalTaskDraft,
} from "@/integrations/ribermax/crm/map-pedido-to-tasks";
import { applyAutoStepTaskOrderingAfterTaskChange } from "@/lib/business/apply-step-task-order";
import { resolveDefaultStepDocumentId } from "@/lib/business/default-task-step";
import { getNextTaskIndex } from "@/lib/business/task-order";
import { listSteps } from "@/lib/repos/steps";
import {
  createTask,
  findTaskByExternalKey,
  getTaskById,
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
 * Creates or updates tasks from a CRM pedido webhook payload.
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
    const existing = await findTaskByExternalKey(draft.crmItemKey);

    if (existing) {
      if (taskNeedsUpdate(existing, draft)) {
        const before = await getTaskById(existing.id);
        await updateCrmPedidoTaskFields(existing.id, {
          name: draft.name,
          qty: draft.qty,
          deliveryDate: draft.deliveryDate,
        });
        const after = await getTaskById(existing.id);
        if (before && after) {
          await applyAutoStepTaskOrderingAfterTaskChange({
            before: {
              stepId: before.stepId,
              deliveryDate: before.deliveryDate,
            },
            after: {
              stepId: after.stepId,
              deliveryDate: after.deliveryDate,
            },
          });
        }
        updated += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    await ensureTemplateTaskForProdId(draft.prodId, draft.name);
    const index = getNextTaskIndex(taskIndexes.map((value) => ({ index: value })));
    taskIndexes.push(index);
    const external = toExternalTaskDraft(draft);
    const groupId = Number(external.externalGroupId);
    await createTask({
      name: external.name,
      qty: external.qty,
      deliveryDate: external.deliveryDate,
      index,
      status: "waiting",
      templateTaskCode: external.templateCode,
      stepId: defaultStepId,
      crmPedidoId: Number.isFinite(groupId) ? groupId : draft.crmPedidoId,
      crmItemKey: external.externalKey,
    });
    await applyAutoStepTaskOrderingAfterTaskChange({
      after: {
        stepId: defaultStepId,
        deliveryDate: draft.deliveryDate,
      },
    });
    created += 1;
  }

  return { created, updated, skipped };
}
