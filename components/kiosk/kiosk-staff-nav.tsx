"use client";

import { useTranslations } from "next-intl";

import { AppBrandLink } from "@/components/app-brand-link";
import { cn } from "@/lib/utils";

import { KioskSessionExitButton } from "./kiosk-session-exit-button";

export const KIOSK_STAFF_NAV_HEIGHT_CLASS = "h-14";

export interface KioskStaffNavProps {
  homeHref: string;
  logoUrl?: string | null;
  menuLogoBackgroundColor?: string | null;
  menuLogoBackgroundColorOpacity?: number | null;
}

/** Device logout header for manager+ on factory kiosk staff routes. */
export function KioskStaffNav({
  homeHref,
  logoUrl = null,
  menuLogoBackgroundColor = null,
  menuLogoBackgroundColorOpacity = null,
}: KioskStaffNavProps) {
  const tKiosk = useTranslations("kiosk");

  return (
    <>
      <header
        className={
          "fixed inset-x-0 top-0 z-50 border-b bg-background shadow-sm"
        }
      >
        <nav
          className={cn(
            "flex items-center gap-3 px-4",
            KIOSK_STAFF_NAV_HEIGHT_CLASS,
          )}
          aria-label={tKiosk("staffTitle")}
        >
          <AppBrandLink
            href={homeHref}
            logoUrl={logoUrl}
            menuLogoBackgroundColor={menuLogoBackgroundColor}
            menuLogoBackgroundColorOpacity={menuLogoBackgroundColorOpacity}
          />

          <div className="min-w-0 flex-1" />

          <KioskSessionExitButton visible />
        </nav>
      </header>

      <div className={KIOSK_STAFF_NAV_HEIGHT_CLASS} aria-hidden />
    </>
  );
}
