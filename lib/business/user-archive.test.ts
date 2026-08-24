import { describe, expect, it } from "vitest";

import { isUserArchivedForHardDelete } from "./user-archive";

describe("isUserArchivedForHardDelete", () => {
  it("treats inactive or blocked users as archivable", () => {
    expect(
      isUserArchivedForHardDelete({ active: false, blocked: true }),
    ).toBe(true);
    expect(
      isUserArchivedForHardDelete({ active: false, blocked: false }),
    ).toBe(true);
    expect(
      isUserArchivedForHardDelete({ active: true, blocked: true }),
    ).toBe(true);
  });

  it("rejects active users that are not blocked", () => {
    expect(
      isUserArchivedForHardDelete({ active: true, blocked: false }),
    ).toBe(false);
  });
});
