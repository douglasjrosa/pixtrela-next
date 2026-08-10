import { getTranslations } from "next-intl/server";

import { ListLoadingMessage } from "@/components/ui/list-loading-message";

export async function AwardsListSkeleton() {
  const t = await getTranslations("awards");
  return <ListLoadingMessage>{t("listLoading")}</ListLoadingMessage>;
}