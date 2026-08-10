import { getTranslations } from "next-intl/server";

export default async function AppLoading() {
  const t = await getTranslations("common");
  return (
    <div
      className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-sm"
      role="status"
    >
      {t("loading")}
    </div>
  );
}
