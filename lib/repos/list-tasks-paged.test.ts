import { afterAll, beforeAll, expect, it } from "vitest";

import { closeDb, getDb } from "@/lib/db/client";
import { describeWithDb } from "@/lib/db/test-utils";
import { createTask, listTasksPaged } from "@/lib/repos/tasks";

describeWithDb("listTasksPaged", () => {
  beforeAll(() => {
    getDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("filters by name and crmItemKey search", async () => {
    const suffix = String(Date.now());
    const byName = await createTask({
      name: `PagedName ${suffix}`,
      deliveryDate: "2026-07-01",
    });
    const byCrm = await createTask({
      name: `Other ${suffix}`,
      deliveryDate: "2026-07-01",
      crmItemKey: `9999:${suffix.slice(-3)}`,
    });

    const nameResult = await listTasksPaged({
      q: `PagedName ${suffix}`,
      statuses: ["waiting", "producing", "paused", "finished", "reviewed", "delivered"],
      from: "2026-01-01",
      to: "2026-12-31",
      page: 1,
      pageSize: 20,
    });
    expect(nameResult.items.some((row) => row.id === byName.id)).toBe(true);

    const crmResult = await listTasksPaged({
      q: `9999:${suffix.slice(-3)}`,
      statuses: ["waiting", "producing", "paused", "finished", "reviewed", "delivered"],
      from: "2026-01-01",
      to: "2026-12-31",
      page: 1,
      pageSize: 20,
    });
    expect(crmResult.items.some((row) => row.id === byCrm.id)).toBe(true);
  });

  it("paginates with pageSize", async () => {
    const suffix = String(Date.now());
    for (let index = 0; index < 3; index += 1) {
      await createTask({
        name: `PageSize ${suffix} ${index}`,
        deliveryDate: "2026-08-15",
      });
    }

    const page1 = await listTasksPaged({
      q: `PageSize ${suffix}`,
      statuses: ["waiting", "producing", "paused", "finished", "reviewed", "delivered"],
      from: "2026-01-01",
      to: "2026-12-31",
      page: 1,
      pageSize: 2,
      sort: { column: "name", direction: "asc" },
    });

    expect(page1.total).toBeGreaterThanOrEqual(3);
    expect(page1.items).toHaveLength(2);

    const page2 = await listTasksPaged({
      q: `PageSize ${suffix}`,
      statuses: ["waiting", "producing", "paused", "finished", "reviewed", "delivered"],
      from: "2026-01-01",
      to: "2026-12-31",
      page: 2,
      pageSize: 2,
      sort: { column: "name", direction: "asc" },
    });
    expect(page2.items.length).toBeGreaterThanOrEqual(1);
  });
});
