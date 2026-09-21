import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { getAppSession } from "@/lib/auth/app-session";
import { loadKioskRouteTheme } from "@/lib/themes/load-route-themes";

import { KioskContentSurface } from "./kiosk-content-surface";
import { KioskHomeHeading } from "./kiosk-home-heading";

export interface KioskEntryScreenProps {
  children: ReactNode;
}

/** Kiosk identify home: title above the content card. */
export async function KioskEntryScreen({ children }: KioskEntryScreenProps) {
  const [theme, tRoutes, session] = await Promise.all([
    loadKioskRouteTheme(),
    getTranslations("settings.themeRoutes"),
    getAppSession(),
  ]);
  const title = theme?.label ?? tRoutes("kiosk");
  const totemName = session?.user?.name ?? null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6">
      <KioskHomeHeading title={title} totemName={totemName} />
      <KioskContentSurface>{children}</KioskContentSurface>
    </div>
  );
}
