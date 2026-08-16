import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { AuthEntryTitle } from "@/components/auth/auth-entry-title";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";

import { KioskContentSurface } from "./kiosk-content-surface";

export interface KioskEntryScreenProps {
  children: ReactNode;
}

/** Kiosk identify home: title above the content card. */
export async function KioskEntryScreen({ children }: KioskEntryScreenProps) {
  const [themes, tRoutes] = await Promise.all([
    loadRouteThemes(),
    getTranslations("settings.themeRoutes"),
  ]);
  const theme = themes.find((entry) => entry.routeKey === "kiosk") ?? null;
  const title = theme?.label ?? tRoutes("kiosk");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6">
      <AuthEntryTitle>{title}</AuthEntryTitle>
      <KioskContentSurface>{children}</KioskContentSurface>
    </div>
  );
}
