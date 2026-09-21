import { getTranslations } from "next-intl/server";

import { AppPageSkeleton } from "@/components/layout/app-page-skeleton";

export async function AwardsListSkeleton() {
  const t = await getTranslations("awards");
  return <AppPageSkeleton label={t("listLoading")} />;
}
