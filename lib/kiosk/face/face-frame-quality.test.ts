import { describe, expect, it } from "vitest";

import { assessFaceFrameQuality } from "./face-frame-quality";

describe("assessFaceFrameQuality", () => {
  it("accepts a single large enough face", () => {
    expect(assessFaceFrameQuality(1, { width: 100, height: 100 })).toEqual({
      ok: true,
    });
  });

  it("rejects no face", () => {
    expect(assessFaceFrameQuality(0, null)).toEqual({
      ok: false,
      reason: "no_face",
    });
  });

  it("rejects multiple faces", () => {
    expect(assessFaceFrameQuality(2, { width: 100, height: 100 })).toEqual({
      ok: false,
      reason: "multiple_faces",
    });
  });

  it("rejects faces that are too small", () => {
    expect(assessFaceFrameQuality(1, { width: 40, height: 40 })).toEqual({
      ok: false,
      reason: "too_small",
    });
  });
});
