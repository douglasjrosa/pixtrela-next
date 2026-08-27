import { afterAll, beforeAll, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { subTaskPresets } from "@/drizzle/schema";
import { closeDb, getDb } from "@/lib/db/client";
import { describeWithDb } from "@/lib/db/test-utils";
import { createFactoryActionRepo } from "@/lib/repos/factory-actions";
import {
  createSubTaskPresetRepo,
  deleteSubTaskPresetById,
  listSubTaskPresetsRepo,
  searchSubTaskPresetsByName,
  updateSubTaskPresetRepo,
} from "@/lib/repos/sub-task-presets";

describeWithDb("sub-task-presets repo", () => {
  beforeAll(() => {
    getDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("creates, searches, updates, lists, and deletes presets", async () => {
    const suffix = String(Date.now());
    const name = `Preset ${suffix}`;
    const actionId = await createFactoryActionRepo({
      name: `Action ${suffix}`,
      description: "Test action",
      unitTime: 1.5,
      qtyQuestion: "How many units?",
    });

    const id = await createSubTaskPresetRepo({
      name,
      sharingType: "duration",
      maxSameTimeWorkers: 2,
      actionId,
    });
    expect(id).toBeTruthy();

    const searched = await searchSubTaskPresetsByName(suffix);
    expect(searched.some((row) => row.documentId === id)).toBe(true);

    await updateSubTaskPresetRepo(id, {
      name: `${name} updated`,
      sharingType: "qty",
      maxSameTimeWorkers: 1,
      actionId,
    });

    const listed = await listSubTaskPresetsRepo();
    const updated = listed.find((row) => row.documentId === id);
    expect(updated?.sharingType).toBe("qty");
    expect(updated?.actionId).toBe(actionId);
    expect(updated?.actionName).toBe(`Action ${suffix}`);

    await deleteSubTaskPresetById(id);
    const db = getDb();
    const [row] = await db
      .select({ id: subTaskPresets.id })
      .from(subTaskPresets)
      .where(eq(subTaskPresets.id, id))
      .limit(1);
    expect(row).toBeUndefined();
  });
});
