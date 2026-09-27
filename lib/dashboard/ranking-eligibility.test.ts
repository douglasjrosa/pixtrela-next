import { describe, expect, it } from "vitest";

import { isMonthlyRankingParticipantRole } from "./ranking-eligibility";

describe("isMonthlyRankingParticipantRole", () => {
  it("includes colaborators and excludes leaders", () => {
    expect(isMonthlyRankingParticipantRole("colaborator")).toBe(true);
    expect(isMonthlyRankingParticipantRole("leader")).toBe(false);
    expect(isMonthlyRankingParticipantRole("manager")).toBe(false);
  });
});
