import { getTranslations } from "next-intl/server";

import { AppPageSkeleton } from "@/components/layout/app-page-skeleton";

export async function WorkdaysListSkeleton() {
  const t = await getTranslations("workdays");
  return <AppPageSkeleton label={t("listLoading")} />;
}
