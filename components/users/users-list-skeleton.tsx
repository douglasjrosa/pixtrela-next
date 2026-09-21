import { getTranslations } from "next-intl/server";

import { AppPageSkeleton } from "@/components/layout/app-page-skeleton";

export async function UsersListSkeleton() {
  const t = await getTranslations("users");
  return <AppPageSkeleton label={t("listLoading")} />;
}
