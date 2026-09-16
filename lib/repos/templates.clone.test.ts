import { afterAll, beforeAll, expect, it } from "vitest";

import { closeDb, getDb } from "@/lib/db/client";
import { describeWithDb } from "@/lib/db/test-utils";
import {
  archiveTemplateTasks,
  cloneTemplateTaskByCode,
  createTemplateTask,
  findTemplateWithSubTasksByCode,
  hardDeleteTemplateTask,
  listTemplateSubTasks,
} from "@/lib/repos/templates";

describeWithDb("templates clone", () => {
  beforeAll(() => {
    getDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("returns null when code is missing or has no subtasks", async () => {
    const suffix = String(Date.now());
    expect(await findTemplateWithSubTasksByCode(`missing-${suffix}`)).toBeNull();

    const empty = await createTemplateTask({
      code: `empty-${suffix}`,
      name: "Empty shell",
      subTasks: [],
    });
    expect(await findTemplateWithSubTasksByCode(empty.code)).toBeNull();
    await hardDeleteTemplateTask(empty.id);
  });

  it("finds a template with subtasks by code", async () => {
    const suffix = String(Date.now());
    const source = await createTemplateTask({
      code: `src-${suffix}`,
      name: "Source",
      subTasks: [
        {
          name: "Cut",
          qty: 2,
          index: 0,
          expectedTime: 36,
          sharingType: "duration",
          maxSameTimeWorkers: 1,
          dependencyIndexes: [],
        },
        {
          name: "Assemble",
          qty: 1,
          index: 1,
          expectedTime: 30,
          sharingType: "qty",
          maxSameTimeWorkers: 2,
          dependencyIndexes: [0],
        },
      ],
    });

    const found = await findTemplateWithSubTasksByCode(source.code);
    expect(found).not.toBeNull();
    expect(found?.template.code).toBe(source.code);
    expect(found?.subTasks).toHaveLength(2);
    expect(found?.subTasks[1]?.dependencyIndexes).toEqual([0]);

    await hardDeleteTemplateTask(source.id);
  });

  it("clones template subtasks to a new code", async () => {
    const suffix = String(Date.now());
    const source = await createTemplateTask({
      code: `from-${suffix}`,
      name: "Original name",
      subTasks: [
        {
          name: "Cut feet",
          qty: 2,
          index: 0,
          expectedTime: 36,
          sharingType: "duration",
          maxSameTimeWorkers: 1,
          dependencyIndexes: [],
          linkedToPrevious: false,
        },
        {
          name: "Mount sides",
          qty: 2,
          index: 1,
          expectedTime: 30,
          sharingType: "qty",
          maxSameTimeWorkers: 2,
          dependencyIndexes: [0],
          linkedToPrevious: true,
        },
      ],
    });

    const cloned = await cloneTemplateTaskByCode({
      fromCode: source.code,
      toCode: `to-${suffix}`,
      name: "Empresa - Caixa Nova",
    });

    expect(cloned.code).toBe(`to-${suffix}`);
    expect(cloned.name).toBe("Empresa - Caixa Nova");

    const rows = await listTemplateSubTasks(cloned.id);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      name: "Cut feet",
      qty: 2,
      expectedTime: 36,
      sharingType: "duration",
    });
    expect(rows[1]).toMatchObject({
      name: "Mount sides",
      qty: 2,
      expectedTime: 30,
      sharingType: "qty",
      maxSameTimeWorkers: 2,
      linkedToPrevious: true,
    });
    expect(rows[1]?.dependencyIndexes).toEqual([0]);

    await hardDeleteTemplateTask(cloned.id);
    await hardDeleteTemplateTask(source.id);
  });

  it("ignores archived templates when resolving clone sources", async () => {
    const suffix = String(Date.now());
    const source = await createTemplateTask({
      code: `archived-${suffix}`,
      name: "Archived source",
      subTasks: [
        {
          name: "Cut",
          qty: 1,
          index: 0,
          expectedTime: 10,
          sharingType: "duration",
          maxSameTimeWorkers: 1,
          dependencyIndexes: [],
        },
      ],
    });

    await archiveTemplateTasks([source.id], "archived for version test");
    expect(await findTemplateWithSubTasksByCode(source.code)).toBeNull();

    await hardDeleteTemplateTask(source.id);
  });

  it("throws when source template has no subtasks", async () => {
    const suffix = String(Date.now());
    const empty = await createTemplateTask({
      code: `shell-${suffix}`,
      name: "Shell",
      subTasks: [],
    });

    await expect(
      cloneTemplateTaskByCode({
        fromCode: empty.code,
        toCode: `dest-${suffix}`,
        name: "Dest",
      }),
    ).rejects.toThrow("templateSourceNotFound");

    await hardDeleteTemplateTask(empty.id);
  });
});
