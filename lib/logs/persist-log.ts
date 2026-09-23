import { LOG_DEDUPE_WINDOW_MS, LOG_DESCRIPTION_MAX_LENGTH } from "@/lib/logs/constants";

export type LogStore = {
  findRecent(input: {
    route: string;
    dedupeKey: string;
    since: Date;
  }): Promise<{ id: string; count: number; description: string } | null>;
  insert(row: {
    userId: string | null;
    route: string;
    description: string;
    detail: string | null;
    count: number;
  }): Promise<void>;
  increment(id: string, count: number, description: string): Promise<void>;
};

export type PersistLogInput = {
  userId: string | null;
  route: string;
  detail: string | null;
  dedupe: boolean;
  dedupeKey?: string;
  refreshDescription: boolean;
  describe: (count: number) => string;
};

function clipDescription(value: string): string {
  return value.slice(0, LOG_DESCRIPTION_MAX_LENGTH);
}

export async function persistLog(
  input: PersistLogInput,
  store: LogStore,
): Promise<void> {
  if (input.dedupe && input.dedupeKey) {
    const since = new Date(Date.now() - LOG_DEDUPE_WINDOW_MS);
    const existing = await store.findRecent({
      route: input.route,
      dedupeKey: input.dedupeKey,
      since,
    });
    if (existing) {
      const nextCount = existing.count + 1;
      const description = input.refreshDescription
        ? clipDescription(input.describe(nextCount))
        : existing.description;
      await store.increment(existing.id, nextCount, description);
      return;
    }
  }

  await store.insert({
    userId: input.userId,
    route: input.route,
    description: clipDescription(input.describe(1)),
    detail: input.detail,
    count: 1,
  });
}

/** Insert failure stays inside this function and never rejects. */
export async function runScheduledLog(
  input: PersistLogInput,
  store: LogStore,
): Promise<void> {
  try {
    await persistLog(input, store);
  } catch {
    return;
  }
}
