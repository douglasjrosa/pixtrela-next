import { deactivateActiveTasksByName as deactivateActiveTasksByNameRepo } from "@/lib/repos/tasks";

/** Deactivates active tasks with the given name via Drizzle repos (E2E cleanup). */
export async function deactivateActiveTasksByName(
  name: string,
): Promise<void> {
  await deactivateActiveTasksByNameRepo(name);
}
