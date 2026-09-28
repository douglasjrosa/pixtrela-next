import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { KioskStaffNav } from "@/components/kiosk/kiosk-staff-nav";
import {
  loadKioskStaffActor,
  showKioskStaffDeviceHeader,
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
  const showDeviceHeader = showKioskStaffDeviceHeader(actor.staffRole);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {showDeviceHeader ? (
        <KioskStaffNav
          homeHref={staffQueuesPath(actor.staffUserId)}
          logoUrl={menuLogo.mediaUrl}
          menuLogoBackgroundColor={menuLogo.config.backgroundColor ?? null}
          menuLogoBackgroundColorOpacity={
            menuLogo.config.backgroundColorOpacity ?? null
          }
        />
      ) : null}
      {children}
    </div>
  );
}
