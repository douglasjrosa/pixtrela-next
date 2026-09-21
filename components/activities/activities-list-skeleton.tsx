import { getTranslations } from "next-intl/server";

import { ListLoadingMessage } from "@/components/ui/list-loading-message";

export async function ActivitiesListSkeleton() {
  const t = await getTranslations("activities");
  return <ListLoadingMessage>{t("listLoading")}</ListLoadingMessage>;
}
