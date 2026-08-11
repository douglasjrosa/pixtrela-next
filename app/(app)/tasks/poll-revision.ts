"use server";

import { isDrizzleBackend } from "@/lib/db/backend";
import { getActiveTasksRevision } from "@/lib/repos/tasks";
import type { TasksRevision } from "@/lib/tasks/tasks-revision";

export async function pollTasksRevision(): Promise<TasksRevision> {
  if (!isDrizzleBackend()) {
    return { count: 0, maxUpdatedAt: null };
  }
  return getActiveTasksRevision();
}
