import { describe, expect, it } from "vitest";

import { buildKioskPeerAssignees } from "./kiosk-peer-assignees";

describe("buildKioskPeerAssignees", () => {
  it("excludes the viewer and marks active peers", () => {
    const peers = buildKioskPeerAssignees(
      ["viewer", "ana", "bob"],
      ["bob"],
      "viewer",
      new Map([
        ["ana", "Ana"],
        ["bob", "Bob"],
      ]),
    );
    expect(peers).toEqual([
      { colaboratorId: "ana", name: "Ana", isActive: false },
      { colaboratorId: "bob", name: "Bob", isActive: true },
    ]);
  });
});
