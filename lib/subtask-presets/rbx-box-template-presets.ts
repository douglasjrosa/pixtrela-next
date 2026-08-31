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
      name: "Corte dos pés da base",
      actionName: "Cortar viga",
      sharingType: "duration",
      maxSameTimeWorkers: 1,
    },
    {
      name: "Corte das tábuas da base",
      actionName: "Cortar tábua",
      sharingType: "duration",
      maxSameTimeWorkers: 1,
    },
    {
      name: "Corte dos sarrafos da embalagem",
      actionName: "Cortar sarrafo amarrado",
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

  return inserted;
}
