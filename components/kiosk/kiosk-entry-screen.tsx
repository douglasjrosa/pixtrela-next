import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";

import { KioskContentSurface } from "./kiosk-content-surface";
import { KioskHomeHeading } from "./kiosk-home-heading";

export interface KioskEntryScreenProps {
  children: ReactNode;
}

/** Kiosk identify home: title above the content card. */
export async function KioskEntryScreen({ children }: KioskEntryScreenProps) {
  const [themes, tRoutes, session] = await Promise.all([
    loadRouteThemes(),
    getTranslations("settings.themeRoutes"),
    auth(),
  ]);
  const theme = themes.find((entry) => entry.routeKey === "kiosk") ?? null;
  const title = theme?.label ?? tRoutes("kiosk");
  const totemName = session?.user?.name ?? null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6">
      <KioskHomeHeading title={title} totemName={totemName} />
      <KioskContentSurface>{children}</KioskContentSurface>
    </div>
  );
}
