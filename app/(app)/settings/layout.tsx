import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import {
  APP_LIST_PAGE_CHROME_CLASS,
  APP_LIST_PAGE_TITLE_CLASS,
  APP_SECTION_TABS_COMPACT_CLASS,
} from "@/components/layout/app-page-layout";
import { SectionTabs } from "@/components/navigation/section-tabs";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const t = await getTranslations("settings");

  if (!canManageSettings(role)) {
    return <ForbiddenMessage />;
  }

  return (
    <div className="space-y-6 p-6 max-[500px]:space-y-3 max-[500px]:p-3">
      <div className={APP_LIST_PAGE_CHROME_CLASS}>
        <h1 className={APP_LIST_PAGE_TITLE_CLASS}>{t("title")}</h1>
        <SectionTabs
          ariaLabel={t("title")}
          className={APP_SECTION_TABS_COMPACT_CLASS}
          items={[
            { href: "/settings/steps", label: t("tabs.steps") },
            { href: "/settings/currency", label: t("tabs.currency") },
            { href: "/settings/automations", label: t("tabs.automations") },
            { href: "/settings/kiosk", label: t("tabs.kiosk") },
            { href: "/settings/themes", label: t("tabs.themes") },
          ]}
        />
      </div>
      {children}
    </div>
  );
}
