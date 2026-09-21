import { getTranslations } from "next-intl/server";

import { AppPageSkeleton } from "@/components/layout/app-page-skeleton";

export async function TasksListSkeleton() {
  const t = await getTranslations("tasks.manage");
  return <AppPageSkeleton label={t("listLoading")} />;
}
