import { listAllSubTaskCategories } from "@/lib/repos/sub-task-categories";

export type SubTaskCategoryOption = {
  id: string;
  name: string;
};

/** Lightweight category list for selects (server components and actions). */
export async function loadSubTaskCategoryOptions(): Promise<
  SubTaskCategoryOption[]
> {
  const rows = await listAllSubTaskCategories();
  return rows.map((row) => ({ id: row.id, name: row.name }));
}
