import { describe, expect, it } from "vitest";
import { SSE_EVENT_NAME } from "./constants.js";
import { formatSseComment, formatSseEvent } from "./sse.js";

describe("SSE framing", () => {
  it("frames the board invalidation event", () => {
    const chunk = formatSseEvent(SSE_EVENT_NAME, { channel: "board" });

    expect(chunk).toBe('event: board-invalidate\ndata: {"channel":"board"}\n\n');
  });

  it("frames heartbeat comments so browsers ignore them", () => {
    expect(formatSseComment("heartbeat")).toBe(": heartbeat\n\n");
  });
});
