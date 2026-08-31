import "dotenv/config";

import { eq } from "drizzle-orm";

import { factoryActions } from "../drizzle/schema";
import { DEFAULT_FACTORY_ACTIONS } from "../lib/actions/default-actions";
import { closeDb, getDb } from "../lib/db/client";
import { seedRbxBoxTemplatePresets } from "../lib/subtask-presets/rbx-box-template-presets";

async function ensureDefaultFactoryActions(
  db: ReturnType<typeof getDb>,
): Promise<number> {
  let inserted = 0;

  for (const row of DEFAULT_FACTORY_ACTIONS) {
    const [existing] = await db
      .select({ id: factoryActions.id })
      .from(factoryActions)
      .where(eq(factoryActions.name, row.name))
      .limit(1);
    if (existing) {
      continue;
    }

    await db.insert(factoryActions).values({
      name: row.name,
      unitTime: row.unitTime,
      description: row.description,
      qtyQuestion: row.qtyQuestion,
    });
    inserted += 1;
  }

  return inserted;
}

async function main(): Promise<void> {
  const db = getDb();
  const actionsInserted = await ensureDefaultFactoryActions(db);
  const presetsInserted = await seedRbxBoxTemplatePresets(db);

  console.log(`Factory actions created: ${actionsInserted}`);
  console.log(`Subtask presets created: ${presetsInserted}`);
  console.log("Ribermax preset seed complete.");
  await closeDb();
}

main().catch(async (error) => {
  console.error(error);
  await closeDb();
  process.exit(1);
});
