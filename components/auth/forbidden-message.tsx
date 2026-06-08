import { getTranslations } from "next-intl/server";

export async function ForbiddenMessage() {
  const t = await getTranslations("errors");
  return (
    <section className="p-6">
      <p className="text-destructive">{t("forbidden")}</p>
    </section>
  );
}
