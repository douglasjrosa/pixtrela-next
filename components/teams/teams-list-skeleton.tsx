import { getTranslations } from "next-intl/server";

import { ListLoadingMessage } from "@/components/ui/list-loading-message";

export async function TeamsListSkeleton() {
  const t = await getTranslations("teams");
  return <ListLoadingMessage>{t("listLoading")}</ListLoadingMessage>;
}
