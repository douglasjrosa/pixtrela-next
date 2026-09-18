import type { TemplateSubTaskComponentInput } from "@/lib/schemas/template-task";

export function applyTemplateDependenciesFromPresets(
  drafts: ReadonlyArray<TemplateSubTaskComponentInput>,
  presetIds: ReadonlyArray<string>,
  defaultDependencyIdsByPreset: ReadonlyMap<string, readonly string[]>,
): TemplateSubTaskComponentInput[] {
  const indexByPresetId = new Map<string, number>();
  presetIds.forEach((presetId, index) => {
    if (!indexByPresetId.has(presetId)) {
      indexByPresetId.set(presetId, index);
    }
  });

  return drafts.map((draft, index) => {
    const presetId = presetIds[index];
    if (!presetId) return draft;

    const dependencyIndexes = [
      ...new Set(
        (defaultDependencyIdsByPreset.get(presetId) ?? [])
          .map((depId) => indexByPresetId.get(depId))
          .filter(
            (depIndex): depIndex is number =>
              depIndex !== undefined && depIndex !== index,
          ),
      ),
    ];

    return {
      ...draft,
      dependencies: dependencyIndexes.length > 0 ? dependencyIndexes : null,
    };
  });
}
