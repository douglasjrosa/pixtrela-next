import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { getAppSession } from "@/lib/auth/app-session";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import {
  APP_LIST_PAGE_CHROME_CLASS,
  APP_LIST_PAGE_TITLE_CLASS,
  APP_SECTION_TABS_COMPACT_CLASS,
} from "@/components/layout/app-page-layout";
import { SectionTabs } from "@/components/navigation/section-tabs";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import { SETTINGS_TAB_DEFS } from "@/lib/settings/settings-tabs";

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAppSession();
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
          items={SETTINGS_TAB_DEFS.map((tab) => ({
            href: tab.href,
            label: t(tab.labelKey),
            activePrefix: tab.activePrefix,
          }))}
        />
      </div>
      {children}
    </div>
  );
}
