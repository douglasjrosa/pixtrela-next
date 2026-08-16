import { beforeEach, describe, expect, it, vi } from "vitest";

const listTeamsPage = vi.fn();

vi.mock("@/lib/repos/teams", () => ({
  listTeamsPage: (...args: unknown[]) => listTeamsPage(...args),
}));

import { loadTeamListPage } from "./load-team-list-page";

describe("loadTeamListPage", () => {
  beforeEach(() => {
    listTeamsPage.mockReset();
  });

  it("maps teams and derives pagination", async () => {
    listTeamsPage.mockResolvedValueOnce({
      items: [
        {
          id: "t1",
          name: "Linha A",
          leaderId: "l1",
          exchangesFirstDay: 3,
          exchangesLastDay: 15,
          since: "2026-01-10",
          until: null,
          active: true,
          leader: { documentId: "l1", name: "João" },
          colaborators: [],
        },
      ],
      total: 12,
    });

    const result = await loadTeamListPage(
      { q: undefined, column: "name", direction: "asc" },
      1,
    );

    expect(listTeamsPage).toHaveBeenCalledWith({
      q: undefined,
      page: 1,
      pageSize: 10,
      sort: { column: "name", direction: "asc" },
    });
    expect(result.hasMore).toBe(true);
    expect(result.pageCount).toBe(2);
    expect(result.teams).toEqual([
      {
        documentId: "t1",
        name: "Linha A",
        exchangesFirstDay: 3,
        exchangesLastDay: 15,
        since: "2026-01-10",
        untill: null,
        leader: { documentId: "l1", name: "João" },
        colaborators: [],
      },
    ]);
  });
});
