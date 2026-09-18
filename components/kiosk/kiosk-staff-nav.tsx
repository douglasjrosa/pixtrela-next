"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppBrandLink } from "@/components/app-brand-link";
import { AppNavUserMenu } from "@/components/app-nav-user-menu";
import { Button } from "@/components/ui/button";
import { KIOSK_HOME_PATH } from "@/lib/auth/colaborator-routes";
import type { ResolvedNavItem } from "@/lib/auth/nav";
import { cn } from "@/lib/utils";

import { useKioskIdleContext } from "./kiosk-idle-provider";
import { KioskSessionExitButton } from "./kiosk-session-exit-button";

export const KIOSK_STAFF_NAV_HEIGHT_CLASS = "h-14";

export interface KioskStaffNavProps {
  userName: string;
  avatarUrl?: string | null;
  canSignOutDevice: boolean;
  homeHref: string;
  items: ResolvedNavItem[];
  logoUrl?: string | null;
  menuLogoBackgroundColor?: string | null;
  menuLogoBackgroundColorOpacity?: number | null;
}

export function KioskStaffNav({
  userName,
  avatarUrl = null,
  canSignOutDevice,
  homeHref,
  items,
  logoUrl = null,
  menuLogoBackgroundColor = null,
  menuLogoBackgroundColorOpacity = null,
}: KioskStaffNavProps) {
  const t = useTranslations();
  const tKiosk = useTranslations("kiosk");
  const router = useRouter();
  const { lockSession } = useKioskIdleContext();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLockToHome(): void {
    lockSession();
    router.replace(KIOSK_HOME_PATH);
  }

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
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label={t("nav.openMenu")}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            onClick={() => setMenuOpen(true)}
          >
            <Menu aria-hidden />
          </Button>

          <AppBrandLink
            href={homeHref}
            logoUrl={logoUrl}
            menuLogoBackgroundColor={menuLogoBackgroundColor}
            menuLogoBackgroundColorOpacity={menuLogoBackgroundColorOpacity}
          />

          <div className="min-w-0 flex-1" />

          {canSignOutDevice ? <KioskSessionExitButton visible /> : null}

          <AppNavUserMenu
            userName={userName}
            avatarUrl={avatarUrl}
            onSignOut={handleLockToHome}
          />
        </nav>
      </header>

      <div className={KIOSK_STAFF_NAV_HEIGHT_CLASS} aria-hidden />

      {menuOpen ? (
        <div
          className="fixed inset-0 z-[60] flex justify-end bg-black/50"
          role="presentation"
          onClick={() => setMenuOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.menuTitle")}
            className={
              "flex h-full w-full max-w-sm flex-col border-l bg-background " +
              "shadow-lg"
            }
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-lg font-semibold">{t("nav.menuTitle")}</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("nav.closeMenu")}
                onClick={() => setMenuOpen(false)}
              >
                ×
              </Button>
            </div>
            <nav
              className="flex-1 overflow-y-auto p-2"
              aria-label={t("nav.menuTitle")}
            >
              <ul className="flex flex-col gap-1">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={
                        "flex min-h-11 items-center rounded-md px-3 text-base " +
                        "hover:bg-muted"
                      }
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
