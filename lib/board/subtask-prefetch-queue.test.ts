import { describe, expect, it, vi } from "vitest";

import {
  LimitedPrefetchQueue,
  PREFETCH_MAX_IN_FLIGHT,
} from "./subtask-prefetch-queue";

describe("LimitedPrefetchQueue", () => {
  it("caps in-flight jobs and skips duplicate ids", async () => {
    const resolvers: Record<string, () => void> = {};
    const started: string[] = [];
    const queue = new LimitedPrefetchQueue(PREFETCH_MAX_IN_FLIGHT, async (id) => {
      started.push(id);
      await new Promise<void>((resolve) => {
        resolvers[id] = resolve;
      });
    });

    queue.enqueue("a");
    queue.enqueue("a");
    queue.enqueue("b");
    queue.enqueue("c");
    queue.enqueue("d");

    await vi.waitFor(() => expect(started).toEqual(["a", "b", "c"]));
    resolvers.a?.();
    await vi.waitFor(() => expect(started).toEqual(["a", "b", "c", "d"]));
    resolvers.b?.();
    resolvers.c?.();
    resolvers.d?.();
  });
});
