import { describe, expect, it } from "vitest";

import { shouldFlushBoardLink } from "./board-link-queue";

describe("shouldFlushBoardLink", () => {
  it("skips while a request is in flight", () => {
    expect(shouldFlushBoardLink(true, true, false)).toBe(false);
  });

  it("skips when there is no desired value", () => {
    expect(shouldFlushBoardLink(undefined, false, false)).toBe(false);
  });

  it("skips when desired already matches the last ack", () => {
    expect(shouldFlushBoardLink(true, false, true)).toBe(false);
  });

  it("flushes when desired differs from the last ack", () => {
    expect(shouldFlushBoardLink(true, false, false)).toBe(true);
    expect(shouldFlushBoardLink(false, false, undefined)).toBe(true);
  });
});
