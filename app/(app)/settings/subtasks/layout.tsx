import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { APP_SECTION_TABS_COMPACT_CLASS } from "@/components/layout/app-page-layout";
import { SectionTabs } from "@/components/navigation/section-tabs";

export default async function SettingsSubtasksLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("settings");

  return (
    <div className="space-y-6">
      <SectionTabs
        ariaLabel={t("tabs.subtasks")}
        className={APP_SECTION_TABS_COMPACT_CLASS}
        items={[
          {
            href: "/settings/subtasks/categories",
            label: t("subtaskTabs.categories"),
          },
          {
            href: "/settings/subtasks/flags",
            label: t("subtaskTabs.flags"),
          },
        ]}
      />
      {children}
    </div>
  );
}
