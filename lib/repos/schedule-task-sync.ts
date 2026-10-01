import { after } from "next/server";

import { getDb } from "@/lib/db/client";
import { logRequestError } from "@/lib/logs/log-request-error";
import { runTaskSubTaskSyncRoutine } from "@/lib/repos/subtask-lifecycle";

const SYNC_ROUTE = "queue.taskSync";

async function runScheduledTaskSync(taskId: string, now: Date): Promise<void> {
  try {
    await runTaskSubTaskSyncRoutine(taskId, getDb(), now);
  } catch (error) {
    await logRequestError(
      error,
      { path: SYNC_ROUTE, method: "POST" },
      { routePath: SYNC_ROUTE, routeType: "sync" },
    );
  }
}

/**
 * History sync reads every activity on the task. It runs after the session
 * transaction commits, and after the response when a request is active.
 */
export async function scheduleTaskSubTaskSync(
  taskId: string,
  now: Date,
): Promise<void> {
  try {
    after(() => runScheduledTaskSync(taskId, now));
  } catch {
    await runTaskSubTaskSyncRoutine(taskId, getDb(), now);
  }
}
