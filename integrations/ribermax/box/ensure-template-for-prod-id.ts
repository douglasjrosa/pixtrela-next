import {
  buildTemplateFromBox,
  PRESET_NOT_FOUND_PREFIX,
} from "@/integrations/ribermax/box/template-from-box";
import { fetchBoxTemplateData } from "@/integrations/ribermax/rbx/rbx-client";
import { findSubTaskPresetByName } from "@/lib/repos/sub-task-presets";
import {
  cloneTemplateTaskByCode,
  createTemplateTask,
  findTemplateByCode,
  findTemplateWithSubTasksByCode,
  updateTemplateTask,
} from "@/lib/repos/templates";
import type {
  TemplateSubTaskComponentInput,
  TemplateTaskFormInput,
} from "@/lib/schemas/template-task";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import type { BoxTemplateData } from "@/integrations/ribermax/rbx/rbx-types";

/** Legacy RBX names → production preset names (prefer first match). */
const PRESET_NAME_ALIASES: Readonly<Record<string, readonly string[]>> = {
  "Corte dos pés da base": [
    "Corte dos pés da base (viga)",
    "Corte dos pés da base (sarrafos)",
  ],
};

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

async function resolvePresetByName(name: string): Promise<SubTaskPreset | null> {
  const direct = await findSubTaskPresetByName(name);
  if (direct) return direct;

  for (const alias of PRESET_NAME_ALIASES[name] ?? []) {
    const found = await findSubTaskPresetByName(alias);
    if (found) return found;
  }
  return null;
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
    const preset = await resolvePresetByName(name);
    if (!preset) {
      throw new Error(`${PRESET_NOT_FOUND_PREFIX}${name}`);
    }
    presetsByName.set(name, preset);
  }
  return presetsByName;
}

/**
 * Codes to try when resolving a template: current prodId, then versions
 * newest-to-oldest (excluding duplicates of the current id).
 */
export function resolveTemplateSourceCodes(
  prodId: number,
  versions: readonly string[] = [],
): string[] {
  const current = String(prodId);
  const seen = new Set<string>([current]);
  const codes = [current];

  for (let i = versions.length - 1; i >= 0; i -= 1) {
    const raw = versions[i];
    if (typeof raw !== "string" && typeof raw !== "number") continue;
    const code = String(raw).trim();
    if (!code || !/^\d+$/.test(code) || seen.has(code)) continue;
    seen.add(code);
    codes.push(code);
  }

  return codes;
}

/**
 * Ensures a template-task exists for the given legacy prodId and has subtasks.
 * Prefers an existing/current template, then clones from ancestral codes in
 * `versions` (newest first), and only then fetches from legacy RBX.
 */
export async function ensureTemplateTaskForProdId(
  prodId: number,
  fallbackName: string,
  versions: readonly string[] = [],
): Promise<string> {
  const code = String(prodId);
  const codes = resolveTemplateSourceCodes(prodId, versions);

  const current = await findTemplateWithSubTasksByCode(code);
  if (current) return current.template.id;

  for (const ancestorCode of codes.slice(1)) {
    const ancestor = await findTemplateWithSubTasksByCode(ancestorCode);
    if (!ancestor) continue;
    const cloned = await cloneTemplateTaskByCode({
      fromCode: ancestorCode,
      toCode: code,
      name: fallbackName,
    });
    return cloned.id;
  }

  // Fetch RBX before writing so a timeout/abort cannot leave an empty shell
  // without a matching production task.
  const data = await fetchBoxTemplateData(prodId);
  const presetsByName = await resolvePresetsForPayload(data);
  const draft = buildTemplateFromBox(data, presetsByName);
  const subTasks = toRepoSubTasks(draft.subTask ?? []);

  const existingShell = await findTemplateByCode(code);
  if (existingShell) {
    await updateTemplateTask({
      id: existingShell.id,
      name: draft.name,
      code: draft.code,
      subTasks,
    });
    return existingShell.id;
  }

  const created = await createTemplateTask({
    code: draft.code,
    name: draft.name,
    subTasks,
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
