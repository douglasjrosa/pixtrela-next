import { getTranslations } from "next-intl/server";

import { ListLoadingMessage } from "@/components/ui/list-loading-message";

export async function UsersListSkeleton() {
  const t = await getTranslations("users");
  return <ListLoadingMessage>{t("listLoading")}</ListLoadingMessage>;
}
