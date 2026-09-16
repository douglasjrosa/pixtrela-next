import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import {
  findSubTaskPresetById,
  findSubTaskPresetByName,
} from "@/lib/repos/sub-task-presets";

/** Canonical name → legacy preset names (prefer first match). */
export const PRESET_NAME_ALIASES: Readonly<Record<string, readonly string[]>> = {
  "Corte dos sarrafos": [
    "Corte dos pés da base (sarrafos)",
    "Corte dos sarrafos da embalagem",
  ],
  "Corte das vigas": ["Corte dos pés da base (viga)"],
  "Corte das tábuas": ["Corte das tábuas da base"],
  "Corte dos pés da base": [
    "Corte das vigas",
    "Corte dos sarrafos",
    "Corte dos pés da base (viga)",
    "Corte dos pés da base (sarrafos)",
  ],
};

export async function resolvePresetByName(
  name: string,
): Promise<SubTaskPreset | null> {
  const direct = await findSubTaskPresetByName(name);
  if (direct) return direct;

  for (const alias of PRESET_NAME_ALIASES[name] ?? []) {
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
  return resolvePresetByName(presetName);
}
