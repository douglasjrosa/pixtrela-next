import { getTranslations } from "next-intl/server";

export async function TemplatesListSkeleton() {
  const t = await getTranslations("templates");
  return (
    <div
      className={
        "text-muted-foreground flex min-h-0 flex-1 items-center " +
        "justify-center text-sm"
      }
      role="status"
    >
      {t("listLoading")}
    </div>
  );
}
