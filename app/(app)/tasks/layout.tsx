import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { StaffSectionTabsBar } from "@/components/navigation/staff-section-tabs-bar";
import type { Role } from "@/lib/auth/nav";
import { loadTasksSectionTabs } from "@/lib/auth/load-staff-section-tabs";
import { canManageTasks } from "@/lib/auth/permissions";

export default async function TasksSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canManageTasks(role)) {
    return <ForbiddenMessage />;
  }

  const [tabs, tNav] = await Promise.all([
    loadTasksSectionTabs(role, {
      tasks: "/tasks",
      templates: "/templates/tasks",
    }),
    getTranslations("nav"),
  ]);

  return (
    <StaffSectionTabsBar tabs={tabs} ariaLabel={tNav("tasks")}>
      {children}
    </StaffSectionTabsBar>
  );
}
