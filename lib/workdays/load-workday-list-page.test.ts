import { beforeEach, describe, expect, it, vi } from "vitest";

const listWorkdaysPage = vi.fn();

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => () => fn(),
}));

vi.mock("@/lib/repos/workdays", () => ({
  listWorkdaysPage: (...args: unknown[]) => listWorkdaysPage(...args),
}));

import { loadWorkdayListPage } from "./load-workday-list-page";
import { defaultWorkdayListFilters } from "./workday-list-params";

describe("loadWorkdayListPage", () => {
  beforeEach(() => {
    listWorkdaysPage.mockReset();
  });

  it("maps rows and computes pagination metadata", async () => {
    listWorkdaysPage.mockResolvedValueOnce({
      items: [
        {
          id: "wd-1",
          description: null,
          action: "work",
          scope: "global",
          timezone: "America/Sao_Paulo",
          validFrom: null,
          validUntil: null,
          active: true,
          createdBy: null,
          updatedBy: null,
          createdAt: new Date("2026-11-24T00:00:00.000Z"),
          updatedAt: new Date("2026-11-24T00:00:00.000Z"),
          teams: [],
          users: [],
          slots: [
            {
              id: "slot-1",
              workdayId: "wd-1",
              isRecurrent: true,
              dayOfWeek: 1,
              date: null,
              startMinute: 480,
              endMinute: 720,
            },
          ],
        },
      ],
      total: 15,
    });

    const result = await loadWorkdayListPage(defaultWorkdayListFilters(), 1);
    expect(result.workdays).toHaveLength(1);
    expect(result.workdays[0]?.documentId).toBe("wd-1");
    expect(result.page).toBe(1);
    expect(result.pageCount).toBe(2);
    expect(result.hasMore).toBe(true);
  });
});
