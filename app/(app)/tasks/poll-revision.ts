"use server";

import { getActiveTasksRevision } from "@/lib/repos/tasks";
import type { TasksRevision } from "@/lib/tasks/tasks-revision";

export async function pollTasksRevision(): Promise<TasksRevision> {
  return getActiveTasksRevision();
}
