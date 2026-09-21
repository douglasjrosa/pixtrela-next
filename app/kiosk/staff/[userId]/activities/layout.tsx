import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { StaffSectionTabsBar } from "@/components/navigation/staff-section-tabs-bar";
import { loadKioskStaffActor } from "@/lib/business/kiosk-staff-access";
import { loadKioskTeamsSectionTabs } from "@/lib/auth/load-kiosk-staff-section-tabs";
import { canViewActivities } from "@/lib/auth/permissions";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ userId: string }>;
}

export default async function KioskActivitiesSectionLayout({
  children,
  params,
}: LayoutProps) {
  const { userId } = await params;
  const actor = await loadKioskStaffActor(userId);
  if (!actor) notFound();

  if (!canViewActivities(actor.staffRole)) {
    return <ForbiddenMessage />;
  }

  const [tabs, tNav] = await Promise.all([
    loadKioskTeamsSectionTabs(actor.staffRole, userId),
    getTranslations("nav"),
  ]);

  return (
    <StaffSectionTabsBar tabs={tabs} ariaLabel={tNav("teams")}>
      {children}
    </StaffSectionTabsBar>
  );
}
