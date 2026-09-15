import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { StaffSectionTabsBar } from "@/components/navigation/staff-section-tabs-bar";
import type { Role } from "@/lib/auth/nav";
import { loadAwardsSectionTabs } from "@/lib/auth/load-staff-section-tabs";
import { canViewExchanges } from "@/lib/auth/permissions";

export default async function ExchangesSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canViewExchanges(role)) {
    return <ForbiddenMessage />;
  }

  const [tabs, tNav] = await Promise.all([
    loadAwardsSectionTabs(role, {
      awards: "/awards",
      exchanges: "/exchanges",
    }),
    getTranslations("nav"),
  ]);

  return (
    <StaffSectionTabsBar tabs={tabs} ariaLabel={tNav("awards")}>
      {children}
    </StaffSectionTabsBar>
  );
}
