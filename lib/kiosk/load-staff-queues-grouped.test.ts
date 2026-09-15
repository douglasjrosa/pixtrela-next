import { describe, expect, it, vi } from "vitest";

import { loadStaffQueuesGrouped } from "./load-staff-queues-grouped";

type QueryResult = unknown[];

function chainable(result: QueryResult) {
  const builder: Record<string, unknown> = {
    from: () => builder,
    innerJoin: () => builder,
    leftJoin: () => builder,
    where: () => builder,
    orderBy: () => Promise.resolve(result),
  };
  return builder;
}

function makeDb(results: QueryResult[]) {
  let index = 0;
  return {
    select: () => chainable(results[index++] ?? []),
  } as never;
}

function load(results: QueryResult[], role: "admin" | "manager" | "leader") {
  return loadStaffQueuesGrouped("staff-1", role, makeDb(results));
}

describe("loadStaffQueuesGrouped", () => {
  it("groups active colaborators under each team sorted as queried", async () => {
    const teamRows = [
      { id: "team-1", name: "Linha 1" },
      { id: "team-2", name: "Linha 2" },
    ];
    const memberRows = [
      {
        teamId: "team-1",
        documentId: "c1",
        name: "Ana",
        code: 1001,
        facePhotoUrl: "/api/media/ana.jpg",
      },
      {
        teamId: "team-2",
        documentId: "c2",
        name: "Bruno",
        code: 1002,
        facePhotoUrl: null,
      },
    ];

    await expect(load([teamRows, memberRows], "manager")).resolves.toEqual({
      teams: [
        {
          teamId: "team-1",
          teamName: "Linha 1",
          members: [
            {
              documentId: "c1",
              name: "Ana",
              code: 1001,
              facePhotoUrl: "/api/media/ana.jpg",
            },
          ],
        },
        {
          teamId: "team-2",
          teamName: "Linha 2",
          members: [
            { documentId: "c2", name: "Bruno", code: 1002, facePhotoUrl: null },
          ],
        },
      ],
    });
  });

  it("lists a colaborator once per team when in several teams", async () => {
    const teamRows = [
      { id: "team-1", name: "Linha 1" },
      { id: "team-2", name: "Linha 2" },
    ];
    const memberRows = [
      { teamId: "team-1", documentId: "c1", name: "Ana", code: 1, facePhotoUrl: null },
      { teamId: "team-2", documentId: "c1", name: "Ana", code: 1, facePhotoUrl: null },
    ];

    const result = await load([teamRows, memberRows], "leader");

    expect(result.teams[0]?.members).toHaveLength(1);
    expect(result.teams[1]?.members).toHaveLength(1);
    expect(result.teams[0]?.members[0]?.documentId).toBe("c1");
    expect(result.teams[1]?.members[0]?.documentId).toBe("c1");
  });

  it("returns an empty result when there are no teams", async () => {
    const spy = vi.fn();
    const db = {
      select: () => {
        spy();
        return chainable([]);
      },
    } as never;

    await expect(
      loadStaffQueuesGrouped("staff-1", "manager", db),
    ).resolves.toEqual({ teams: [] });
    // Only the teams query runs; no member query when there are no teams.
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("returns empty members for a team with no colaborators", async () => {
    const teamRows = [{ id: "team-1", name: "Linha 1" }];
    const result = await load([teamRows, []], "admin");
    expect(result.teams[0]?.members).toEqual([]);
  });
});
