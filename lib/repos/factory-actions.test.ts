import { afterAll, beforeAll, expect, it } from "vitest";

import { closeDb, getDb } from "@/lib/db/client";
import { describeWithDb } from "@/lib/db/test-utils";
import {
  createFactoryActionRepo,
  deleteFactoryActionById,
  getFactoryActionById,
  updateFactoryActionRepo,
} from "@/lib/repos/factory-actions";
import { createSubTaskPresetRepo } from "@/lib/repos/sub-task-presets";

describeWithDb("factory-actions repo", () => {
  beforeAll(() => {
    getDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("creates, updates, and deletes unused actions", async () => {
    const suffix = String(Date.now());
    const id = await createFactoryActionRepo({
      name: `Action ${suffix}`,
      description: "desc",
      unitTime: 2.5,
      qtyQuestion: "How many?",
    });
    const created = await getFactoryActionById(id);
    expect(created?.name).toBe(`Action ${suffix}`);
    expect(created?.unitTime).toBe(2.5);

    await updateFactoryActionRepo(id, {
      name: `Action ${suffix} b`,
      description: "desc 2",
      unitTime: 3,
      qtyQuestion: "How many now?",
    });
    const updated = await getFactoryActionById(id);
    expect(updated?.name).toBe(`Action ${suffix} b`);

    await deleteFactoryActionById(id);
    expect(await getFactoryActionById(id)).toBeNull();
  });

  it("blocks delete when a preset uses the action", async () => {
    const suffix = String(Date.now());
    const actionId = await createFactoryActionRepo({
      name: `Used ${suffix}`,
      description: "in use",
      unitTime: 1,
      qtyQuestion: "How many?",
    });
    await createSubTaskPresetRepo({
      name: `Preset ${suffix}`,
      sharingType: "qty",
      maxSameTimeWorkers: 1,
      actionId,
    });

    await expect(deleteFactoryActionById(actionId)).rejects.toThrow(
      "actionInUse",
    );
    expect(await getFactoryActionById(actionId)).not.toBeNull();
  });
});
