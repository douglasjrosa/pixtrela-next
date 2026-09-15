import { getTranslations } from "next-intl/server";

import { APP_LIST_PAGE_SHELL_CLASS } from "@/components/layout/app-page-layout";

export async function KioskStaffWebHint() {
  const t = await getTranslations("kiosk");

  return (
    <section className={APP_LIST_PAGE_SHELL_CLASS}>
      <p className="text-muted-foreground">{t("staffWebHint")}</p>
    </section>
  );
}
