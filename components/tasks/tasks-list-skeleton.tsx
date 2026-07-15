import { getTranslations } from "next-intl/server";

export async function TasksListSkeleton() {
  const t = await getTranslations("tasks.manage");
  return (
    <div
      className="text-muted-foreground flex min-h-0 flex-1 items-center justify-center text-sm"
      role="status"
    >
      {t("listLoading")}
    </div>
  );
}
