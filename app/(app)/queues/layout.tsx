import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { getAppSession } from "@/lib/auth/session";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { StaffSectionTabsBar } from "@/components/navigation/staff-section-tabs-bar";
import type { Role } from "@/lib/auth/nav";
import { loadTeamsSectionTabs } from "@/lib/auth/load-staff-section-tabs";
import { canViewQueues } from "@/lib/auth/permissions";

export default async function QueuesSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAppSession();
  const role = session?.user?.role as Role | undefined;

  if (!canViewQueues(role)) {
    return <ForbiddenMessage />;
  }

  const [tabs, tNav] = await Promise.all([
    loadTeamsSectionTabs(role, {
      queues: "/queues",
      teams: "/teams",
      users: "/users",
    }),
    getTranslations("nav"),
  ]);

  return (
    <StaffSectionTabsBar tabs={tabs} ariaLabel={tNav("teams")}>
      {children}
    </StaffSectionTabsBar>
  );
}
