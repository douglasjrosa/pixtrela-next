import { describe, expect, it } from "vitest";

import {
  FACE_1N_AMBIGUITY_MARGIN,
  FACE_DESCRIPTOR_LENGTH,
  FACE_MATCH_DISTANCE_THRESHOLD,
} from "./face-match-constants";
import { rankFaceMatches } from "./face-1n-rank";

function makeVector(seed: number): number[] {
  return Array.from({ length: FACE_DESCRIPTOR_LENGTH }, (_, index) => {
    return ((seed + index) % 17) / 17;
  });
}

describe("rankFaceMatches", () => {
  const threshold = FACE_MATCH_DISTANCE_THRESHOLD;
  const margin = FACE_1N_AMBIGUITY_MARGIN;

  it("returns match for a unique close candidate", () => {
    const probe = makeVector(1);
    const close = probe.map((value) => value + 0.001);
    expect(
      rankFaceMatches(probe, [
        { documentId: "a", faceVector: close },
        { documentId: "b", faceVector: makeVector(99) },
      ]).status,
    ).toBe("match");
  });

  it("returns ambiguous when two candidates are close", () => {
    const probe = makeVector(2);
    expect(
      rankFaceMatches(
        probe,
        [
          { documentId: "a", faceVector: probe.map((value) => value + 0.001) },
          { documentId: "b", faceVector: probe.map((value) => value + 0.002) },
        ],
        { threshold, margin },
      ).status,
    ).toBe("ambiguous");
  });

  it("returns none when nobody matches", () => {
    expect(
      rankFaceMatches(makeVector(3), [
        { documentId: "a", faceVector: makeVector(80) },
      ]).status,
    ).toBe("none");
  });
});
