import { describe, expect, it } from "vitest";

import {
  FACE_1N_AMBIGUITY_MARGIN,
  FACE_DESCRIPTOR_LENGTH,
  FACE_MATCH_DISTANCE_THRESHOLD,
} from "./face-match-constants";
import { faceDescriptorDistance, isFaceMatch } from "./face-descriptor-distance";

/**
 * Mirrors Strapi rankFaceMatches decision for UI expectations.
 */
function classify1nMatch(
  probe: number[],
  gallery: Array<{ id: string; vector: number[] }>,
): "match" | "ambiguous" | "none" {
  const ranked = gallery
    .map((entry) => ({
      id: entry.id,
      distance: faceDescriptorDistance(probe, entry.vector),
    }))
    .sort((a, b) => a.distance - b.distance)
    .filter((row) => isFaceMatch(row.distance, FACE_MATCH_DISTANCE_THRESHOLD));

  if (ranked.length === 0) return "none";
  const best = ranked[0]!;
  const second = ranked[1];
  if (!second || second.distance >= best.distance + FACE_1N_AMBIGUITY_MARGIN) {
    return "match";
  }
  return "ambiguous";
}

function makeVector(seed: number): number[] {
  return Array.from({ length: FACE_DESCRIPTOR_LENGTH }, (_, index) => {
    return ((seed + index) % 17) / 17;
  });
}

describe("classify1nMatch (mirrors Strapi face-vector)", () => {
  it("returns match for a unique close candidate", () => {
    const probe = makeVector(1);
    const close = probe.map((value) => value + 0.001);
    expect(
      classify1nMatch(probe, [
        { id: "a", vector: close },
        { id: "b", vector: makeVector(99) },
      ]),
    ).toBe("match");
  });

  it("returns ambiguous when two candidates are close", () => {
    const probe = makeVector(2);
    expect(
      classify1nMatch(probe, [
        { id: "a", vector: probe.map((value) => value + 0.001) },
        { id: "b", vector: probe.map((value) => value + 0.002) },
      ]),
    ).toBe("ambiguous");
  });

  it("returns none when nobody matches", () => {
    expect(
      classify1nMatch(makeVector(3), [{ id: "a", vector: makeVector(80) }]),
    ).toBe("none");
  });
});
