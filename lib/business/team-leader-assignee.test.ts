import { describe, expect, it } from "vitest";

import {
  appendTeamLeaderAsLastMember,
  canAssignUserIdToSubTask,
} from "./team-leader-assignee";

describe("appendTeamLeaderAsLastMember", () => {
  const ana = { documentId: "c1", name: "Ana" };
  const bruno = { documentId: "c2", name: "Bruno" };
  const lead = { documentId: "lead-1", name: "Lia" };

  it("appends the team leader last with isLeader", () => {
    expect(appendTeamLeaderAsLastMember([ana, bruno], lead)).toEqual([
      { documentId: "c1", name: "Ana" },
      { documentId: "c2", name: "Bruno" },
      { documentId: "lead-1", name: "Lia", isLeader: true },
    ]);
  });

  it("moves an already-listed leader to the end instead of duplicating", () => {
    expect(
      appendTeamLeaderAsLastMember([lead, ana], lead),
    ).toEqual([
      { documentId: "c1", name: "Ana" },
      { documentId: "lead-1", name: "Lia", isLeader: true },
    ]);
  });

  it("leaves colaborators unchanged when the team has no leader", () => {
    expect(appendTeamLeaderAsLastMember([ana], null)).toEqual([ana]);
  });
});

describe("canAssignUserIdToSubTask", () => {
  it("allows a leader user id as an assignee", () => {
    expect(canAssignUserIdToSubTask("lead-1")).toBe(true);
  });

  it("rejects an empty user id", () => {
    expect(canAssignUserIdToSubTask("")).toBe(false);
    expect(canAssignUserIdToSubTask("   ")).toBe(false);
  });
});
