import { FACE_MATCH_DISTANCE_THRESHOLD } from "./face-match-constants";

/**
 * Euclidean distance between two face descriptors (Float32Array / number[]).
 */
export function faceDescriptorDistance(
  a: ArrayLike<number>,
  b: ArrayLike<number>,
): number {
  if (a.length !== b.length || a.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const delta = a[i]! - b[i]!;
    sum += delta * delta;
  }
  return Math.sqrt(sum);
}

export function isFaceMatch(
  distance: number,
  threshold: number = FACE_MATCH_DISTANCE_THRESHOLD,
): boolean {
  return Number.isFinite(distance) && distance < threshold;
}
