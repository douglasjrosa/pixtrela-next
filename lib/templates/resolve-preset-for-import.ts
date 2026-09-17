import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import {
  findSubTaskPresetById,
  findSubTaskPresetByName,
} from "@/lib/repos/sub-task-presets";
import { PRESET_NAME_ALIASES } from "@/lib/templates/preset-name-aliases";
import {
  canonicalRbxBoxImportPresetName,
  ensureRbxBoxTemplatePresetByImportName,
} from "@/lib/subtask-presets/rbx-box-template-presets";

export { PRESET_NAME_ALIASES } from "@/lib/templates/preset-name-aliases";

export async function resolvePresetByName(
  name: string,
): Promise<SubTaskPreset | null> {
  const trimmed = name.trim();
  const direct = await findSubTaskPresetByName(trimmed);
  if (direct) return direct;

  const canonical = canonicalRbxBoxImportPresetName(trimmed);
  if (canonical && canonical !== trimmed) {
    const byCanonical = await findSubTaskPresetByName(canonical);
    if (byCanonical) return byCanonical;
  }

  for (const alias of PRESET_NAME_ALIASES[trimmed] ?? []) {
    const found = await findSubTaskPresetByName(alias);
    if (found) return found;
  }
  return null;
}

/**
 * Resolves a preset preferring UUID, then exact/aliased name.
 */
export async function resolvePresetForImport(input: {
  presetId?: string | null;
  presetName?: string | null;
}): Promise<SubTaskPreset | null> {
  const presetId = input.presetId?.trim() ?? "";
  if (presetId) {
    const byId = await findSubTaskPresetById(presetId);
    if (byId) return byId;
  }

  const presetName = input.presetName?.trim() ?? "";
  if (!presetName) return null;

  const resolved = await resolvePresetByName(presetName);
  if (resolved) return resolved;

  return ensureRbxBoxTemplatePresetByImportName(presetName);
}
