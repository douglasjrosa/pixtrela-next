import { resolvePresetByName } from "@/lib/templates/resolve-preset-for-import";

export function mergeSubTaskCategoryId(
  storedCategoryId: string | null | undefined,
  presetCategoryId: string | null | undefined,
): string | null {
  const stored = storedCategoryId?.trim() ?? "";
  if (stored) return stored;
  const preset = presetCategoryId?.trim() ?? "";
  return preset || null;
}

export async function resolveSubTaskCategoryId(
  subTaskName: string,
  storedCategoryId: string | null | undefined,
): Promise<string | null> {
  const merged = mergeSubTaskCategoryId(storedCategoryId, null);
  if (merged) return merged;
  const preset = await resolvePresetByName(subTaskName);
  return mergeSubTaskCategoryId(null, preset?.subTaskCategoryId);
}

export async function loadPresetCategoryIdsBySubTaskName(
  names: readonly string[],
): Promise<Map<string, string | null>> {
  const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  const out = new Map<string, string | null>();
  for (const name of unique) {
    const preset = await resolvePresetByName(name);
    out.set(name, preset?.subTaskCategoryId ?? null);
  }
  return out;
}
