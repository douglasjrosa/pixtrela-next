import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { KioskStaffNav } from "@/components/kiosk/kiosk-staff-nav";
import { kioskStaffSlimNavItems } from "@/lib/auth/kiosk-staff-slim-nav";
import { resolveNavItemLabels } from "@/lib/auth/nav";
import {
  canKioskSignOutDevice,
  loadKioskStaffActor,
} from "@/lib/business/kiosk-staff-access";
import { staffQueuesPath } from "@/lib/business/kiosk-staff-paths";
import { loadBrandingForLayout } from "@/lib/themes/load-branding";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ userId: string }>;
}

export default async function KioskStaffLayout({
  children,
  params,
}: LayoutProps) {
  const { userId } = await params;
  const [actor, branding] = await Promise.all([
    loadKioskStaffActor(userId),
    loadBrandingForLayout(),
  ]);

  if (!actor) {
    notFound();
  }

  const menuLogo = branding.menu_logo;
  const tNav = await getTranslations("nav");
  const navItems = resolveNavItemLabels(
    kioskStaffSlimNavItems(actor.staffUserId),
    {
      queues: tNav("queues"),
      teamAccess: tNav("teamAccess"),
    },
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <KioskStaffNav
        userName={actor.name}
        avatarUrl={actor.avatarUrl}
        homeHref={staffQueuesPath(actor.staffUserId)}
        items={navItems}
        canSignOutDevice={canKioskSignOutDevice(actor.staffRole)}
        logoUrl={menuLogo.mediaUrl}
        menuLogoBackgroundColor={menuLogo.config.backgroundColor ?? null}
        menuLogoBackgroundColorOpacity={
          menuLogo.config.backgroundColorOpacity ?? null
        }
      />
      {children}
    </div>
  );
}
