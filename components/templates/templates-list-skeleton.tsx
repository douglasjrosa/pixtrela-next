import { getTranslations } from "next-intl/server";

import { ListLoadingMessage } from "@/components/ui/list-loading-message";

export async function TemplatesListSkeleton() {
  const t = await getTranslations("templates");
  return <ListLoadingMessage>{t("listLoading")}</ListLoadingMessage>;
}
