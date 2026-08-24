import { eq } from "drizzle-orm";

import { ribermaxBoxTemplateSettings } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";

import {
  DEFAULT_BOX_TEMPLATE_RATES,
  type RibermaxBoxTemplateRates,
} from "./schema";

export async function getOrCreateBoxTemplateRates(
  db: Db = getDb(),
): Promise<RibermaxBoxTemplateRates> {
  const [row] = await db.select().from(ribermaxBoxTemplateSettings).limit(1);
  if (row) {
    return {
      cutSeconds: row.cutSeconds,
      adhesiveSeconds: row.adhesiveSeconds,
      fastenerSeconds: row.fastenerSeconds,
    };
  }

  const [created] = await db
    .insert(ribermaxBoxTemplateSettings)
    .values({
      cutSeconds: DEFAULT_BOX_TEMPLATE_RATES.cutSeconds,
      adhesiveSeconds: DEFAULT_BOX_TEMPLATE_RATES.adhesiveSeconds,
      fastenerSeconds: DEFAULT_BOX_TEMPLATE_RATES.fastenerSeconds,
    })
    .returning();

  return {
    cutSeconds: created.cutSeconds,
    adhesiveSeconds: created.adhesiveSeconds,
    fastenerSeconds: created.fastenerSeconds,
  };
}

export async function upsertBoxTemplateRates(
  input: RibermaxBoxTemplateRates,
  db: Db = getDb(),
): Promise<RibermaxBoxTemplateRates> {
  const existing = await db.select().from(ribermaxBoxTemplateSettings).limit(1);
  if (existing[0]) {
    const [updated] = await db
      .update(ribermaxBoxTemplateSettings)
      .set({
        cutSeconds: input.cutSeconds,
        adhesiveSeconds: input.adhesiveSeconds,
        fastenerSeconds: input.fastenerSeconds,
        updatedAt: new Date(),
      })
      .where(eq(ribermaxBoxTemplateSettings.id, existing[0].id))
      .returning();
    return {
      cutSeconds: updated.cutSeconds,
      adhesiveSeconds: updated.adhesiveSeconds,
      fastenerSeconds: updated.fastenerSeconds,
    };
  }

  const [created] = await db
    .insert(ribermaxBoxTemplateSettings)
    .values({
      cutSeconds: input.cutSeconds,
      adhesiveSeconds: input.adhesiveSeconds,
      fastenerSeconds: input.fastenerSeconds,
    })
    .returning();
  return {
    cutSeconds: created.cutSeconds,
    adhesiveSeconds: created.adhesiveSeconds,
    fastenerSeconds: created.fastenerSeconds,
  };
}
