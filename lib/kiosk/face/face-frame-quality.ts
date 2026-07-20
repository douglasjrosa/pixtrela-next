import { FACE_MIN_BOX_SIZE_PX } from "./face-match-constants";

export type FaceBoxSize = {
  width: number;
  height: number;
};

export type FaceFrameQuality =
  | { ok: true }
  | { ok: false; reason: "no_face" | "multiple_faces" | "too_small" };

export function assessFaceFrameQuality(
  faceCount: number,
  box: FaceBoxSize | null,
  minBoxSizePx: number = FACE_MIN_BOX_SIZE_PX,
): FaceFrameQuality {
  if (faceCount <= 0) return { ok: false, reason: "no_face" };
  if (faceCount > 1) return { ok: false, reason: "multiple_faces" };
  if (!box) return { ok: false, reason: "no_face" };
  if (box.width < minBoxSizePx || box.height < minBoxSizePx) {
    return { ok: false, reason: "too_small" };
  }
  return { ok: true };
}
