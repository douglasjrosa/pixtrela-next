import { getTranslations } from "next-intl/server";

import { ListLoadingMessage } from "@/components/ui/list-loading-message";

export async function TasksListSkeleton() {
  const t = await getTranslations("tasks.manage");
  return <ListLoadingMessage>{t("listLoading")}</ListLoadingMessage>;
}
