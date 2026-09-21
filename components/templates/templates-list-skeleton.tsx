import { getTranslations } from "next-intl/server";

import { AppPageSkeleton } from "@/components/layout/app-page-skeleton";

export async function TemplatesListSkeleton() {
  const t = await getTranslations("templates");
  return <AppPageSkeleton label={t("listLoading")} />;
}
