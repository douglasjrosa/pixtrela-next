import { ensureTemplateForTaskCode } from "@/lib/templates/ensure-template-for-task-code";
import { applyAutoStepTaskOrderingAfterTaskChange } from "@/lib/business/apply-step-task-order";
import { resolveDefaultStepDocumentId } from "@/lib/business/default-task-step";
import { getNextTaskIndex } from "@/lib/business/task-order";
import type { ApiTaskUpsertInput } from "@/lib/schemas/api-task";
import { crmPedidoIdFromExternalKey } from "@/lib/schemas/api-task";
import { listSteps } from "@/lib/repos/steps";
import {
  createTask,
  findTaskByExternalKey,
  getTaskById,
  listActiveTasksForBoard,
  updateCrmPedidoTaskFields,
} from "@/lib/repos/tasks";

export type UpsertTaskFromApiResult = {
  action: "created" | "updated" | "skipped";
  taskId: string;
  templateSource?: "legacy" | "existing" | "payload";
};

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

function taskNeedsUpdate(
  existing: { name: string; qty: number; deliveryDate: string | null },
  input: ApiTaskUpsertInput,
): boolean {
  const nextDelivery = input.deliveryDate ?? null;
  return (
    existing.name !== input.name ||
    existing.qty !== input.qty ||
    (existing.deliveryDate ?? null) !== nextDelivery
  );
}

/**
 * Idempotent task upsert for the CRM REST API (`externalKey`).
 * Ensures template via legacy → existing shell → payload before create.
 */
export async function upsertTaskFromApi(
  input: ApiTaskUpsertInput,
): Promise<UpsertTaskFromApiResult> {
  const existing = await findTaskByExternalKey(input.externalKey);
  if (existing) {
    if (!taskNeedsUpdate(existing, input)) {
      return { action: "skipped", taskId: existing.id };
    }
    const before = await getTaskById(existing.id);
    await updateCrmPedidoTaskFields(existing.id, {
      name: input.name,
      qty: input.qty,
      deliveryDate: input.deliveryDate ?? null,
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
    return { action: "updated", taskId: existing.id };
  }

  const ensured = await ensureTemplateForTaskCode({
    code: input.templateTaskCode,
    fallbackName: input.name,
    versions: (input.versions ?? []).map(String),
    template: input.template ?? null,
  });

  const defaultStepId = await loadDefaultStepId();
  const boardTasks = await listActiveTasksForBoard();
  const index = getNextTaskIndex(
    boardTasks.map((task) => ({ index: task.index })),
  );
  const crmPedidoId = crmPedidoIdFromExternalKey(input.externalKey);

  const created = await createTask({
    name: input.name,
    qty: input.qty,
    deliveryDate: input.deliveryDate ?? null,
    index,
    status: "waiting",
    templateTaskCode: input.templateTaskCode,
    stepId: defaultStepId,
    crmPedidoId,
    crmItemKey: input.externalKey,
  });

  await applyAutoStepTaskOrderingAfterTaskChange({
    after: {
      stepId: defaultStepId,
      deliveryDate: input.deliveryDate ?? null,
    },
  });

  return {
    action: "created",
    taskId: created.id,
    templateSource: ensured.source,
  };
}
