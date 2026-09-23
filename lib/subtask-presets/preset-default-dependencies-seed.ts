import { eq } from "drizzle-orm";

import { subTaskPresets } from "@/drizzle/schema";
import type { Db } from "@/lib/db/client";

/** Legacy RBX box dependency graph keyed by canonical preset name. */
export const PRESET_DEFAULT_DEPENDENCY_NAMES: Readonly<
  Record<string, readonly string[]>
> = {
  "Montagem dos pés": [
    "Corte das vigas",
    "Corte dos sarrafos",
    "Corte dos pés da base (viga)",
    "Corte dos pés da base (sarrafos)",
    "Corte dos pés da base",
  ],
  "Montagem da base": [
    "Corte das tábuas",
    "Corte das tábuas da base",
    "Montagem dos pés",
  ],
  "Montagem dos quadros das laterais": ["Corte dos sarrafos"],
  "Montagem dos quadros das cabeceiras": ["Corte dos sarrafos"],
  "Montagem dos quadros da tampa": ["Corte dos sarrafos"],
  "Fixação das chapas das laterais": [
    "Montagem dos quadros das laterais",
    "Corte das chapas das laterais",
  ],
  "Fixação das chapas das cabeceiras": [
    "Montagem dos quadros das cabeceiras",
    "Corte das chapas das cabeceiras",
  ],
  "Fixação das chapas da tampa": [
    "Montagem dos quadros da tampa",
    "Corte da chapa da tampa",
  ],
  "Fixação dos adesivos das laterais": ["Fixação das chapas das laterais"],
  "Fixação dos adesivos das cabeceiras": ["Fixação das chapas das cabeceiras"],
};

export function normalizeDefaultDependencyPresetIds(
  ids: readonly string[] | null | undefined,
  selfId?: string,
): string[] {
  const unique = [...new Set((ids ?? []).map((id) => id.trim()).filter(Boolean))];
  if (!selfId) return unique;
  return unique.filter((id) => id !== selfId);
}

/**
 * Seeds RBX preset default dependencies from the legacy name graph.
 * Only fills presets that still have an empty dependency list.
 */
export async function seedRbxPresetDefaultDependencies(db: Db): Promise<number> {
  const rows = await db
    .select({
      id: subTaskPresets.id,
      name: subTaskPresets.name,
      defaultDependencyPresetIds: subTaskPresets.defaultDependencyPresetIds,
    })
    .from(subTaskPresets);

  const idByName = new Map(rows.map((row) => [row.name, row.id]));
  let updated = 0;

  for (const row of rows) {
    if ((row.defaultDependencyPresetIds ?? []).length > 0) continue;

    const dependencyNames = PRESET_DEFAULT_DEPENDENCY_NAMES[row.name];
    if (!dependencyNames?.length) continue;

    const dependencyIds = [
      ...new Set(
        dependencyNames
          .map((name) => idByName.get(name))
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (dependencyIds.length === 0) continue;

    await db
      .update(subTaskPresets)
      .set({
        defaultDependencyPresetIds: dependencyIds,
        updatedAt: new Date(),
      })
      .where(eq(subTaskPresets.id, row.id));
    updated += 1;
  }

  return updated;
}
