import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { KioskStaffNav } from "@/components/kiosk/kiosk-staff-nav";
import {
  canKioskSignOutDevice,
  loadKioskStaffActor,
} from "@/lib/business/kiosk-staff-access";
import { kioskStaffNavPaths } from "@/lib/business/kiosk-staff-paths";
import {
  resolveNavItemLabels,
  staffNavItemsForRole,
} from "@/lib/auth/nav";
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
  const paths = kioskStaffNavPaths(actor.staffUserId);
  const tNav = await getTranslations("nav");
  const navItems = resolveNavItemLabels(
    staffNavItemsForRole(actor.staffRole, paths),
    {
      panel: tNav("panel"),
      board: tNav("board"),
      tasks: tNav("tasks"),
      teams: tNav("teams"),
      awards: tNav("awards"),
      settings: tNav("settings"),
    },
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <KioskStaffNav
        userName={actor.name}
        avatarUrl={actor.avatarUrl}
        homeHref={paths.panel}
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
