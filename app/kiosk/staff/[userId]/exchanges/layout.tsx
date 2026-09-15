import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { StaffSectionTabsBar } from "@/components/navigation/staff-section-tabs-bar";
import { loadKioskStaffActor } from "@/lib/business/kiosk-staff-access";
import { loadKioskAwardsSectionTabs } from "@/lib/auth/load-kiosk-staff-section-tabs";
import { canViewExchanges } from "@/lib/auth/permissions";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ userId: string }>;
}

export default async function KioskExchangesSectionLayout({
  children,
  params,
}: LayoutProps) {
  const { userId } = await params;
  const actor = await loadKioskStaffActor(userId);
  if (!actor) notFound();

  if (!canViewExchanges(actor.staffRole)) {
    return <ForbiddenMessage />;
  }

  const [tabs, tNav] = await Promise.all([
    loadKioskAwardsSectionTabs(actor.staffRole, userId),
    getTranslations("nav"),
  ]);

  return (
    <StaffSectionTabsBar tabs={tabs} ariaLabel={tNav("awards")}>
      {children}
    </StaffSectionTabsBar>
  );
}
