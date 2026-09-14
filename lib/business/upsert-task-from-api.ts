import { ensureTemplateForTaskCode } from "@/lib/templates/ensure-template-for-task-code";
import { applyAutoStepTaskOrderingAfterTaskChange } from "@/lib/business/apply-step-task-order";
import { resolveDefaultStepDocumentId } from "@/lib/business/default-task-step";
import { getNextTaskIndex } from "@/lib/business/task-order";
import type { ApiTaskUpsertInput } from "@/lib/schemas/api-task";
import {
  crmPedidoIdFromExternalKey,
  toBoxTemplateData,
} from "@/lib/schemas/api-task";
import { listSteps } from "@/lib/repos/steps";
import {
  createTask,
  findTaskByExternalKey,
  getTaskById,
  listActiveTasksForBoard,
  updateCrmPedidoTaskFields,
} from "@/lib/repos/tasks";

export type UpsertDebugStage = {
  stage: string;
  ms: number;
  detail?: string;
};

export type UpsertTaskFromApiResult = {
  action: "created" | "updated" | "skipped";
  taskId: string;
  templateSource?: "legacy" | "existing" | "payload" | "rbx";
  debugTrace?: UpsertDebugStage[];
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
function pushStage(
  trace: UpsertDebugStage[],
  startedAt: number,
  stage: string,
  detail?: string,
): void {
  trace.push({ stage, ms: Date.now() - startedAt, detail });
}

export async function upsertTaskFromApi(
  input: ApiTaskUpsertInput,
): Promise<UpsertTaskFromApiResult> {
  const startedAt = Date.now();
  const debugTrace: UpsertDebugStage[] = [];
  pushStage(
    debugTrace,
    startedAt,
    "upsert_start",
    `code=${input.templateTaskCode} hasTemplate=${Boolean(input.template)}`,
  );

  const existing = await findTaskByExternalKey(input.externalKey);
  if (existing) {
    if (!taskNeedsUpdate(existing, input)) {
      pushStage(debugTrace, startedAt, "upsert_skipped", existing.id);
      return { action: "skipped", taskId: existing.id, debugTrace };
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
    pushStage(debugTrace, startedAt, "upsert_updated", existing.id);
    return { action: "updated", taskId: existing.id, debugTrace };
  }

  const ensureStartedAt = Date.now();
  const templatePayload = toBoxTemplateData(input.template);
  const ensured = await ensureTemplateForTaskCode({
    code: input.templateTaskCode,
    fallbackName: input.name,
    versions: (input.versions ?? []).map(String),
    template: templatePayload,
    debugTrace: debugTrace,
  });
  pushStage(
    debugTrace,
    ensureStartedAt,
    "ensure_template_total",
    `source=${ensured.source}`,
  );

  const stepStartedAt = Date.now();
  const defaultStepId = await loadDefaultStepId();
  pushStage(debugTrace, stepStartedAt, "load_default_step", defaultStepId);

  const boardStartedAt = Date.now();
  const boardTasks = await listActiveTasksForBoard();
  pushStage(
    debugTrace,
    boardStartedAt,
    "list_active_board_tasks",
    `count=${boardTasks.length}`,
  );
  const index = getNextTaskIndex(
    boardTasks.map((task) => ({ index: task.index })),
  );
  const crmPedidoId = crmPedidoIdFromExternalKey(input.externalKey);

  const createStartedAt = Date.now();
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

  pushStage(debugTrace, createStartedAt, "create_task", created.id);

  const orderStartedAt = Date.now();
  await applyAutoStepTaskOrderingAfterTaskChange({
    after: {
      stepId: defaultStepId,
      deliveryDate: input.deliveryDate ?? null,
    },
  });
  pushStage(debugTrace, orderStartedAt, "apply_step_ordering");

  pushStage(debugTrace, startedAt, "upsert_done", ensured.source);
  // #region agent log
  console.info(
    "[pixtrela-upsert-debug]",
    JSON.stringify({
      sessionId: "cb9202",
      externalKey: input.externalKey,
      templateSource: ensured.source,
      debugTrace,
    }),
  );
  // #endregion

  return {
    action: "created",
    taskId: created.id,
    templateSource: ensured.source,
    debugTrace,
  };
}
