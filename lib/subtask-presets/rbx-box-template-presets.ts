import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import { DEFAULT_FACTORY_ACTIONS } from "@/lib/actions/default-actions";
import { getDb, type Db } from "@/lib/db/client";
import { findSubTaskPresetByName } from "@/lib/repos/sub-task-presets";
import { PRESET_NAME_ALIASES } from "@/lib/templates/preset-name-aliases";

export type RbxBoxTemplatePresetSeed = {
  name: string;
  actionName: string;
  sharingType: "qty" | "duration";
  maxSameTimeWorkers: number;
};

/**
 * Canonical SubTaskPreset catalog for Ribermax box template import.
 * Names must match RBX `presetName` values exactly.
 */
export const RBX_BOX_TEMPLATE_PRESET_SEEDS: readonly RbxBoxTemplatePresetSeed[] =
  [
    {
      name: "Corte dos sarrafos",
      actionName: "Cortar sarrafo amarrado",
      sharingType: "duration",
      maxSameTimeWorkers: 1,
    },
    {
      name: "Corte das vigas",
      actionName: "Cortar viga",
      sharingType: "duration",
      maxSameTimeWorkers: 1,
    },
    {
      name: "Corte das tábuas",
      actionName: "Cortar tábua",
      sharingType: "duration",
      maxSameTimeWorkers: 1,
    },
    {
      name: "Corte das chapas das laterais",
      actionName: "Cortar compensado",
      sharingType: "duration",
      maxSameTimeWorkers: 1,
    },
    {
      name: "Corte das chapas das cabeceiras",
      actionName: "Cortar compensado",
      sharingType: "duration",
      maxSameTimeWorkers: 1,
    },
    {
      name: "Corte da chapa da tampa",
      actionName: "Cortar compensado",
      sharingType: "duration",
      maxSameTimeWorkers: 1,
    },
    {
      name: "Montagem dos pés",
      actionName: "Pregar toco no pé do palete",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
    },
    {
      name: "Montagem da base",
      actionName: "Pregar tábua do palete",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
    },
    {
      name: "Montagem dos quadros das laterais",
      actionName: "Grampear quadro",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
    },
    {
      name: "Fixação das chapas das laterais",
      actionName: "Grampear chapa",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
    },
    {
      name: "Fixação dos adesivos das laterais",
      actionName: "Fixar adesivo",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
    },
    {
      name: "Montagem dos quadros das cabeceiras",
      actionName: "Grampear quadro",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
    },
    {
      name: "Fixação das chapas das cabeceiras",
      actionName: "Grampear chapa",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
    },
    {
      name: "Fixação dos adesivos das cabeceiras",
      actionName: "Fixar adesivo",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
    },
    {
      name: "Montagem dos quadros da tampa",
      actionName: "Grampear quadro",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
    },
    {
      name: "Fixação das chapas da tampa",
      actionName: "Grampear chapa",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
    },
    {
      name: "Fixação dos adesivos da tampa",
      actionName: "Fixar adesivo",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
    },
    {
      name: "Fixar adesivo - Extra Grande",
      actionName: "Fixar adesivo - Extra Grande",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
    },
    {
      name: "Grampear quadro - Extra Grande",
      actionName: "Grampear quadro - Extra Grande",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
    },
    {
      name: "Fechar caixa - Extra Grande",
      actionName: "Fechar caixa - Extra Grande",
      sharingType: "qty",
      maxSameTimeWorkers: 2,
    },
  ];

export function findRbxBoxTemplatePresetSeedByName(
  name: string,
): RbxBoxTemplatePresetSeed | null {
  const trimmed = name.trim();
  return RBX_BOX_TEMPLATE_PRESET_SEEDS.find((row) => row.name === trimmed) ?? null;
}

/** Maps RBX/CRM import names to the canonical Pixtrela preset catalog name. */
export function canonicalRbxBoxImportPresetName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (findRbxBoxTemplatePresetSeedByName(trimmed)) return trimmed;

  for (const [canonical, aliases] of Object.entries(PRESET_NAME_ALIASES)) {
    if (aliases.includes(trimmed)) return canonical;
  }

  return null;
}

async function ensureFactoryActionByName(
  actionName: string,
  db: Db,
): Promise<string> {
  const { eq } = await import("drizzle-orm");
  const { factoryActions } = await import("@/drizzle/schema");

  const [existing] = await db
    .select({ id: factoryActions.id })
    .from(factoryActions)
    .where(eq(factoryActions.name, actionName))
    .limit(1);
  if (existing) return existing.id;

  const seed = DEFAULT_FACTORY_ACTIONS.find((row) => row.name === actionName);
  if (!seed) {
    throw new Error(`factoryActionNotFound:${actionName}`);
  }

  const [created] = await db
    .insert(factoryActions)
    .values({
      name: seed.name,
      unitTime: seed.unitTime,
      description: seed.description,
      qtyQuestion: seed.qtyQuestion,
    })
    .returning({ id: factoryActions.id });
  return created.id;
}

/**
 * Ensures a catalog preset exists for RBX/CRM import names (canonical or legacy).
 */
export async function ensureRbxBoxTemplatePresetByImportName(
  importName: string,
  db: Db = getDb(),
): Promise<SubTaskPreset | null> {
  const canonical = canonicalRbxBoxImportPresetName(importName);
  if (!canonical) return null;

  const active = await findSubTaskPresetByName(canonical, db);
  if (active) return active;

  const seed = findRbxBoxTemplatePresetSeedByName(canonical);
  if (!seed) return null;

  const { eq } = await import("drizzle-orm");
  const { subTaskPresets } = await import("@/drizzle/schema");

  const [existing] = await db
    .select({ id: subTaskPresets.id, active: subTaskPresets.active })
    .from(subTaskPresets)
    .where(eq(subTaskPresets.name, canonical))
    .limit(1);

  if (existing) {
    if (!existing.active) {
      await db
        .update(subTaskPresets)
        .set({ active: true, updatedAt: new Date() })
        .where(eq(subTaskPresets.id, existing.id));
    }
    return findSubTaskPresetByName(canonical, db);
  }

  const actionId = await ensureFactoryActionByName(seed.actionName, db);
  await db.insert(subTaskPresets).values({
    name: seed.name,
    sharingType: seed.sharingType,
    maxSameTimeWorkers: seed.maxSameTimeWorkers,
    actionId,
  });

  return findSubTaskPresetByName(canonical, db);
}

export async function seedRbxBoxTemplatePresets(
  db: import("@/lib/db/client").Db,
): Promise<number> {
  const { eq } = await import("drizzle-orm");
  const { factoryActions, subTaskPresets } = await import("@/drizzle/schema");

  const actions = await db
    .select({ id: factoryActions.id, name: factoryActions.name })
    .from(factoryActions);
  const actionIdByName = new Map(actions.map((row) => [row.name, row.id]));

  let inserted = 0;
  for (const preset of RBX_BOX_TEMPLATE_PRESET_SEEDS) {
    const [existing] = await db
      .select({ id: subTaskPresets.id })
      .from(subTaskPresets)
      .where(eq(subTaskPresets.name, preset.name))
      .limit(1);
    if (existing) {
      continue;
    }

    const actionId = actionIdByName.get(preset.actionName);
    if (!actionId) {
      throw new Error(`factoryActionNotFound:${preset.actionName}`);
    }

    await db.insert(subTaskPresets).values({
      name: preset.name,
      sharingType: preset.sharingType,
      maxSameTimeWorkers: preset.maxSameTimeWorkers,
      actionId,
    });
    inserted += 1;
  }

  const { seedRbxPresetDefaultDependencies } = await import(
    "@/lib/subtask-presets/preset-default-dependencies-seed"
  );
  await seedRbxPresetDefaultDependencies(db);

  return inserted;
}
