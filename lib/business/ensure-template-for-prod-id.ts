import { buildTemplateFromBox } from "@/lib/business/template-from-box";
import { fetchBoxTemplateData } from "@/lib/legacy/rbx-client";
import { crmWebhookLog } from "@/lib/crm/webhook-logger";
import {
  createTemplateTask,
  findTemplateByCode,
  updateTemplateTask,
} from "@/lib/repos/templates";
import type { TemplateSubTaskComponentInput } from "@/lib/schemas/template-task";

function dependencyIndexesFrom(
  dependencies: TemplateSubTaskComponentInput["dependencies"],
): number[] {
  if (!Array.isArray(dependencies)) return [];
  return dependencies.filter((value): value is number => typeof value === "number");
}

function toRepoSubTasks(subTasks: TemplateSubTaskComponentInput[]) {
  return subTasks.map((row, index) => ({
    name: row.name,
    qty: row.qty,
    sharingType: row.sharingType,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    index,
    expectedTime: row.expectedTime,
    dependencyIndexes: dependencyIndexesFrom(row.dependencies),
  }));
}

/**
 * Ensures a template-task exists for the given legacy prodId and has subtasks.
 */
export async function ensureTemplateTaskForProdId(
  prodId: number,
  fallbackName: string,
): Promise<string> {
  const code = String(prodId);
  const existing = await findTemplateByCode(code);
  if (existing) {
    crmWebhookLog.info("template_exists", { prodId, templateId: existing.id });
    return existing.id;
  }

  crmWebhookLog.info("template_create_started", { prodId, fallbackName });

  const created = await createTemplateTask({
    code,
    name: fallbackName,
    subTasks: [],
  });

  const data = await fetchBoxTemplateData(prodId);
  const draft = buildTemplateFromBox(data);

  await updateTemplateTask({
    id: created.id,
    name: draft.name,
    code: draft.code,
    subTasks: toRepoSubTasks(draft.subTask ?? []),
  });

  crmWebhookLog.info("template_created_from_legacy", {
    prodId,
    templateId: created.id,
    subTaskCount: draft.subTask?.length ?? 0,
  });

  return created.id;
}
