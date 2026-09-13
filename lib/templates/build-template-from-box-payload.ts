import { calculateExpectedTimeFromAction } from "@/lib/actions/default-actions";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import type {
  TemplateSubTaskComponentInput,
  TemplateTaskFormInput,
} from "@/lib/schemas/template-task";
import { applyTemplateSubTaskDependencies } from "@/integrations/ribermax/box/template-subtask-dependencies";
import type {
  BoxTemplateData,
  LegacyNumber,
} from "@/integrations/ribermax/rbx/rbx-types";
import { resolvePresetForImport } from "@/lib/templates/resolve-preset-for-import";

export const PRESET_NOT_FOUND_PREFIX = "presetNotFound:";

export function presetNotFoundError(label: string): Error {
  return new Error(`${PRESET_NOT_FOUND_PREFIX}${label}`);
}

function toNumber(value: LegacyNumber): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toPositiveInt(value: LegacyNumber): number {
  return Math.max(1, Math.round(toNumber(value)));
}

function buildTemplateName(empresaNome: string, boxName: string): string {
  const company = empresaNome.trim();
  const box = boxName.trim();
  return company ? `${company} - ${box}` : box;
}

function draftFromPreset(
  preset: SubTaskPreset,
  qty: number,
  actionUnits: number,
  index: number,
): TemplateSubTaskComponentInput {
  return {
    name: preset.name,
    qty,
    sharingType: preset.sharingType,
    maxSameTimeWorkers: preset.maxSameTimeWorkers,
    index,
    expectedTime: calculateExpectedTimeFromAction(
      preset.actionUnitTime,
      actionUnits,
    ),
    dependencies: null,
    subTaskCategoryId: preset.subTaskCategoryId ?? null,
  };
}

/**
 * Builds a template form draft from box payload.
 * Resolves each subtask via presetId first, then presetName.
 */
export async function buildTemplateFromBoxPayload(
  data: BoxTemplateData,
): Promise<TemplateTaskFormInput> {
  const drafts: TemplateSubTaskComponentInput[] = [];

  for (let index = 0; index < data.subtasks.length; index += 1) {
    const item = data.subtasks[index];
    const preset = await resolvePresetForImport({
      presetId: item.presetId,
      presetName: item.presetName,
    });
    if (!preset) {
      const label = item.presetId?.trim() || item.presetName.trim() || "unknown";
      throw presetNotFoundError(label);
    }
    drafts.push(
      draftFromPreset(
        preset,
        toPositiveInt(item.qty),
        toNumber(item.actionUnits),
        index,
      ),
    );
  }

  return {
    name: buildTemplateName(data.empresaNome, data.boxName),
    code: String(data.prodId),
    subTask: applyTemplateSubTaskDependencies(drafts),
  };
}
