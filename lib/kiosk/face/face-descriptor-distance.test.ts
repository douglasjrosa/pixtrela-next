import { describe, expect, it } from "vitest";

import {
  faceDescriptorDistance,
  isFaceMatch,
} from "./face-descriptor-distance";
import { FACE_MATCH_DISTANCE_THRESHOLD } from "./face-match-constants";

describe("faceDescriptorDistance", () => {
  it("returns 0 for identical descriptors", () => {
    expect(faceDescriptorDistance([1, 2, 3], [1, 2, 3])).toBe(0);
  });

  it("returns euclidean distance", () => {
    expect(faceDescriptorDistance([0, 0], [3, 4])).toBe(5);
  });

  it("returns infinity for mismatched lengths", () => {
    expect(faceDescriptorDistance([1], [1, 2])).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("isFaceMatch", () => {
  it("accepts distances below the threshold", () => {
    expect(isFaceMatch(FACE_MATCH_DISTANCE_THRESHOLD - 0.01)).toBe(true);
  });

  it("rejects distances at or above the threshold", () => {
    expect(isFaceMatch(FACE_MATCH_DISTANCE_THRESHOLD)).toBe(false);
    expect(isFaceMatch(0.9)).toBe(false);
  });
});
