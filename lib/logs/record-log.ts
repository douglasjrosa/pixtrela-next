import { after } from "next/server";

import { auth } from "@/auth";
import {
  bugSentence,
  crmTasksSentence,
  successSentence,
  type SuccessAuditInput,
} from "@/lib/logs/audit-sentence";
import { CRM_TASKS_DEDUPE_KEY, CRM_TASKS_ROUTE } from "@/lib/logs/constants";
import {
  formatBugDetail,
  isSkippableLogError,
  logErrorCode,
  logErrorSummary,
  sanitizeToken,
} from "@/lib/logs/log-error";
import { drizzleLogStore } from "@/lib/logs/log-store";
import {
  persistLog,
  runScheduledLog,
  type PersistLogInput,
} from "@/lib/logs/persist-log";

export type { LogStore, PersistLogInput } from "@/lib/logs/persist-log";
export { persistLog, runScheduledLog } from "@/lib/logs/persist-log";

export function scheduleLog(input: PersistLogInput): void {
  const store = drizzleLogStore();
  try {
    after(() => {
      void runScheduledLog(input, store);
    });
  } catch {
    void runScheduledLog(input, store);
  }
}

async function readActorId(): Promise<string | null> {
  try {
    const session = await auth();
    const id = session?.user?.id;
    return typeof id === "string" && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

export async function auditSuccess(
  input: SuccessAuditInput & { route: string },
): Promise<void> {
  const userId = await readActorId();
  scheduleLog({
    userId,
    route: input.route,
    detail: null,
    dedupe: false,
    refreshDescription: false,
    describe: () => successSentence(input),
  });
}

export async function auditBug(input: {
  route: string;
  operation: string;
  error: unknown;
  ids?: Record<string, string | number | null | undefined>;
  /** Write the row before the HTTP response. CRM failures use this. */
  immediate?: boolean;
}): Promise<void> {
  if (isSkippableLogError(input.error)) return;
  const userId = await readActorId();
  const code = logErrorCode(input.error);
  const operation = sanitizeToken(input.operation);
  const summary = input.immediate ? logErrorSummary(input.error) : undefined;
  const detail = formatBugDetail(input.operation, code, input.ids, summary);
  if (input.immediate) {
    console.error(detail, input.error);
    try {
      await persistLog(
        {
          userId,
          route: input.route,
          detail,
          dedupe: false,
          refreshDescription: false,
          describe: () => bugSentence(input.operation),
        },
        drizzleLogStore(),
      );
    } catch (persistError) {
      console.error("audit log persist failed", persistError);
    }
    return;
  }
  scheduleLog({
    userId,
    route: input.route,
    detail,
    dedupe: true,
    dedupeKey: `${operation}|${code}`,
    refreshDescription: false,
    describe: () => bugSentence(input.operation),
  });
}

/** One system row per dedupe window for CRM task create, update, or delete. */
export function scheduleCrmTasksLog(): void {
  scheduleLog({
    userId: null,
    route: CRM_TASKS_ROUTE,
    detail: CRM_TASKS_DEDUPE_KEY,
    dedupe: true,
    dedupeKey: CRM_TASKS_DEDUPE_KEY,
    refreshDescription: true,
    describe: (count) => crmTasksSentence(count),
  });
}
