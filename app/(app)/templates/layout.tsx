import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { getAppSession } from "@/lib/auth/app-session";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { StaffSectionTabsBar } from "@/components/navigation/staff-section-tabs-bar";
import { TemplatesLayoutClient } from "@/components/templates/templates-layout-client";
import type { Role } from "@/lib/auth/nav";
import { loadTasksSectionTabs } from "@/lib/auth/load-staff-section-tabs";
import { canManageTemplates } from "@/lib/auth/permissions";

export default async function TemplatesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAppSession();
  const role = session?.user?.role as Role | undefined;
  const t = await getTranslations("templates");

  if (!canManageTemplates(role)) {
    return <ForbiddenMessage />;
  }

  const [sectionTabs, tNav] = await Promise.all([
    loadTasksSectionTabs(role, {
      tasks: "/tasks",
      templates: "/templates/tasks",
    }),
    getTranslations("nav"),
  ]);

  return (
    <StaffSectionTabsBar tabs={sectionTabs} ariaLabel={tNav("tasks")}>
      <TemplatesLayoutClient
        title={t("title")}
        tabsAriaLabel={t("title")}
        tabItems={[
          { href: "/templates/tasks", label: t("tasksTab") },
          { href: "/templates/subtasks", label: t("subtasksTab") },
          { href: "/templates/actions", label: t("actionsTab") },
        ]}
      >
        {children}
      </TemplatesLayoutClient>
    </StaffSectionTabsBar>
  );
}
