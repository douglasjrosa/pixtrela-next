import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { APP_SECTION_TABS_COMPACT_CLASS } from "@/components/layout/app-page-layout";
import { SectionTabs } from "@/components/navigation/section-tabs";

export default async function SettingsIntegrationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("settings");

  return (
    <div className="space-y-6">
      <SectionTabs
        ariaLabel={t("tabs.integrations")}
        className={APP_SECTION_TABS_COMPACT_CLASS}
        items={[
          {
            href: "/settings/integrations/ribermax",
            label: t("integrationTabs.ribermax"),
          },
          {
            href: "/settings/integrations/crm",
            label: t("integrationTabs.crm"),
          },
        ]}
      />
      {children}
    </div>
  );
}
