import type { SubTaskCategoryOption } from "@/lib/subtasks/category-options";

export function resolveSubTaskCategoryDisplayName(
  categoryId: string | null | undefined,
  categoryOptions: readonly SubTaskCategoryOption[],
  joinedName?: string | null,
  noCategoryLabel = "Sem categoria",
): string {
  const trimmedJoined = joinedName?.trim();
  if (trimmedJoined) return trimmedJoined;

  const id = categoryId?.trim();
  if (!id) return noCategoryLabel;

  const match = categoryOptions.find((option) => option.id === id);
  return match?.name?.trim() || noCategoryLabel;
}
