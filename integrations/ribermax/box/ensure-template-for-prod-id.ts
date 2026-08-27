import { buildTemplateFromBox } from "@/integrations/ribermax/box/template-from-box";
import { fetchBoxTemplateData } from "@/integrations/ribermax/rbx/rbx-client";
import { findSubTaskPresetByName } from "@/lib/repos/sub-task-presets";
import {
  createTemplateTask,
  findTemplateByCode,
  updateTemplateTask,
} from "@/lib/repos/templates";
import type {
  TemplateSubTaskComponentInput,
  TemplateTaskFormInput,
} from "@/lib/schemas/template-task";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import type { BoxTemplateData } from "@/integrations/ribermax/rbx/rbx-types";

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
    subTaskCategoryId: row.subTaskCategoryId ?? null,
  }));
}

async function resolvePresetsForPayload(
  data: BoxTemplateData,
): Promise<Map<string, SubTaskPreset>> {
  const names = [
    ...new Set(
      data.subtasks.map((item) => item.presetName.trim()).filter(Boolean),
    ),
  ];
  const presetsByName = new Map<string, SubTaskPreset>();
  for (const name of names) {
    const preset = await findSubTaskPresetByName(name);
    if (!preset) {
      throw new Error(`presetNotFound:${name}`);
    }
    presetsByName.set(name, preset);
  }
  return presetsByName;
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
  if (existing) return existing.id;

  const created = await createTemplateTask({
    code,
    name: fallbackName,
    subTasks: [],
  });

  const data = await fetchBoxTemplateData(prodId);
  const presetsByName = await resolvePresetsForPayload(data);
  const draft = buildTemplateFromBox(data, presetsByName);

  await updateTemplateTask({
    id: created.id,
    name: draft.name,
    code: draft.code,
    subTasks: toRepoSubTasks(draft.subTask ?? []),
  });

  return created.id;
}

/** Loads a box template draft from RBX using current plugin mapping. */
export async function loadRibermaxTemplateFromBoxCode(
  code: string,
): Promise<TemplateTaskFormInput> {
  const boxId = Number(code.trim());
  if (!Number.isInteger(boxId) || boxId <= 0) {
    throw new Error("invalidCode");
  }
  const data = await fetchBoxTemplateData(boxId);
  const presetsByName = await resolvePresetsForPayload(data);
  return buildTemplateFromBox(data, presetsByName);
}
