import { ensureTemplateTaskForProdId } from "@/lib/business/ensure-template-for-prod-id";
import { resolveDefaultStepDocumentId } from "@/lib/business/default-task-step";
import { getNextTaskIndex } from "@/lib/business/task-order";
import { mapPedidoToTaskDrafts } from "@/lib/crm/map-pedido-to-tasks";
import { strapiServiceFetch } from "@/lib/strapi/service-fetch";

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

interface StrapiList<T> {
  data: T[];
}

interface StepEntity {
  documentId: string;
  name: string;
}

interface TaskIndexEntity {
  index: number;
}

interface ExistingTaskEntity {
  documentId: string;
  name: string;
  qty: number;
  deliveryDate?: string | null;
}

export function isEligiblePedidoPayload(payload: CrmPedidoWebhookPayload): boolean {
  return Boolean(payload.Bpedido?.trim());
}

async function loadDefaultStepDocumentId(): Promise<string> {
  const res = await strapiServiceFetch<StrapiList<StepEntity>>("/steps", {
    query: {
      fields: ["documentId", "name"],
      sort: "index:asc",
      pagination: { pageSize: 50 },
    },
  });
  const stepDocumentId = resolveDefaultStepDocumentId(res.data);
  if (!stepDocumentId) {
    throw new Error("no_default_step");
  }
  return stepDocumentId;
}

async function loadTaskIndexes(): Promise<number[]> {
  const res = await strapiServiceFetch<StrapiList<TaskIndexEntity>>("/tasks", {
    query: {
      fields: ["index"],
      filters: { active: { $eq: true } },
      pagination: { pageSize: 500 },
    },
  });
  return res.data.map((task) => task.index);
}

async function findTaskByCrmItemKey(
  crmItemKey: string,
): Promise<ExistingTaskEntity | null> {
  const res = await strapiServiceFetch<StrapiList<ExistingTaskEntity>>("/tasks", {
    query: {
      fields: ["documentId", "name", "qty", "deliveryDate", "crmItemKey"],
      filters: { crmItemKey: { $eq: crmItemKey } },
      pagination: { pageSize: 1 },
    },
  });
  return res.data[0] ?? null;
}

async function createTaskFromDraft(
  draft: ReturnType<typeof mapPedidoToTaskDrafts>[number],
  stepDocumentId: string,
  index: number,
): Promise<void> {
  await strapiServiceFetch("/tasks", {
    method: "POST",
    body: JSON.stringify({
      data: {
        name: draft.name,
        qty: draft.qty,
        deliveryDate: draft.deliveryDate,
        index,
        status: "waiting",
        templateTaskCode: draft.templateTaskCode,
        step: stepDocumentId,
        active: true,
        crmPedidoId: draft.crmPedidoId,
        crmItemKey: draft.crmItemKey,
      },
    }),
  });
}

async function updateTaskFromDraft(
  documentId: string,
  draft: ReturnType<typeof mapPedidoToTaskDrafts>[number],
): Promise<void> {
  await strapiServiceFetch(`/tasks/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        name: draft.name,
        qty: draft.qty,
        deliveryDate: draft.deliveryDate,
      },
    }),
  });
}

function taskNeedsUpdate(
  existing: ExistingTaskEntity,
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

  const defaultStepDocumentId = await loadDefaultStepDocumentId();
  const taskIndexes = await loadTaskIndexes();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const draft of drafts) {
    const existing = await findTaskByCrmItemKey(draft.crmItemKey);

    if (existing) {
      if (taskNeedsUpdate(existing, draft)) {
        await updateTaskFromDraft(existing.documentId, draft);
        updated += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    await ensureTemplateTaskForProdId(draft.prodId, draft.name);
    const index = getNextTaskIndex(taskIndexes.map((value) => ({ index: value })));
    taskIndexes.push(index);
    await createTaskFromDraft(draft, defaultStepDocumentId, index);
    created += 1;
  }

  return { created, updated, skipped };
}
