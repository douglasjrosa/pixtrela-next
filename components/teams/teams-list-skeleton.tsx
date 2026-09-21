import { getTranslations } from "next-intl/server";

import { AppPageSkeleton } from "@/components/layout/app-page-skeleton";

export async function TeamsListSkeleton() {
  const t = await getTranslations("teams");
  return <AppPageSkeleton label={t("listLoading")} />;
}
