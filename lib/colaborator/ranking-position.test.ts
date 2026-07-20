import { describe, expect, it } from "vitest";

import {
  primaryCurrencyRanking,
  resolveRankingPosition,
} from "./ranking-position";

const rows = [
  { rank: 1, userDocumentId: "u1", name: "Ana", totalIncome: 200 },
  { rank: 2, userDocumentId: "u2", name: "Bruno", totalIncome: 150 },
  { rank: 3, userDocumentId: "u3", name: "Carla", totalIncome: 100 },
  { rank: 4, userDocumentId: "u4", name: "Diego", totalIncome: 40 },
];

describe("resolveRankingPosition", () => {
  it("returns top 3 and gap to the next place", () => {
    const result = resolveRankingPosition(rows, "u3");
    expect(result.topRows).toHaveLength(3);
    expect(result.row?.rank).toBe(3);
    expect(result.nextRow?.userDocumentId).toBe("u2");
    expect(result.starsToNext).toBe(50);
  });

  it("returns null gap for first place", () => {
    const result = resolveRankingPosition(rows, "u1");
    expect(result.nextRow).toBeNull();
    expect(result.starsToNext).toBeNull();
  });

  it("returns null row when user is absent", () => {
    const result = resolveRankingPosition(rows, "missing");
    expect(result.row).toBeNull();
    expect(result.topRows).toHaveLength(3);
  });
});

describe("primaryCurrencyRanking", () => {
  it("returns the first currency ranking", () => {
    expect(
      primaryCurrencyRanking([
        { id: 1, name: "star", title: "Estrela", pluralTitle: "Estrelas", rows },
      ])?.name,
    ).toBe("star");
  });
});
