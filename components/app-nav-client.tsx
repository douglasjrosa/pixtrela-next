"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

import { AppBrandLink } from "@/components/app-brand-link";
import { AppNavMobileMenu } from "@/components/app-nav-mobile-menu";
import { AppNavUserMenu } from "@/components/app-nav-user-menu";
import { TotemModeSwitch } from "@/components/nav/totem-mode-switch";
import { Button } from "@/components/ui/button";
import { useMeasuredNavLayout } from "@/hooks/use-measured-nav-layout";
import { isAppNavLinkActive } from "@/lib/auth/is-app-nav-link-active";
import type { ResolvedNavItem } from "@/lib/auth/nav";
import {
  APP_NAV_LINK_BASE_CLASS,
  appNavLinkClass,
} from "@/lib/ui/app-nav-link-styles";

export const APP_NAV_HEIGHT_CLASS = "h-14";

export interface AppNavClientProps {
  logoUrl?: string | null;
  menuLogoBackgroundColor?: string | null;
  menuLogoBackgroundColorOpacity?: number | null;
  homeHref: string;
  profileHref: string | null;
  userName: string;
  avatarUrl?: string | null;
  items: ResolvedNavItem[];
  totemMode?: boolean;
  showTotemSwitch?: boolean;
}

export function AppNavClient({
  logoUrl = null,
  menuLogoBackgroundColor = null,
  menuLogoBackgroundColorOpacity = null,
  homeHref,
  profileHref,
  userName,
  avatarUrl = null,
  items,
  totemMode = false,
  showTotemSwitch = false,
}: AppNavClientProps) {
  const t = useTranslations();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const measureKey = items.map((item) => item.href).join("|");
  const { slotRef, measureRef, layoutMode } = useMeasuredNavLayout(measureKey);
  const navVisible = !totemMode && items.length > 0;
  const showHamburger = navVisible && layoutMode !== "desktop";
  const effectiveMenuOpen = menuOpen && showHamburger;

  function handleSignOut(): void {
    void signOut({ callbackUrl: "/login" });
  }

  const showDesktopLinks = navVisible && layoutMode === "desktop";

  return (
    <>
      <header
        className={
          "fixed inset-x-0 top-0 z-50 border-b bg-background shadow-sm"
        }
      >
        <nav
          className={`flex items-center gap-3 px-4 ${APP_NAV_HEIGHT_CLASS}`}
          aria-label={t("app.name")}
        >
          {showHamburger ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              aria-label={t("nav.openMenu")}
              aria-expanded={effectiveMenuOpen}
              aria-haspopup="dialog"
              onClick={() => setMenuOpen(true)}
            >
              <Menu aria-hidden />
            </Button>
          ) : null}

          <AppBrandLink
            href={homeHref}
            logoUrl={logoUrl}
            menuLogoBackgroundColor={menuLogoBackgroundColor}
            menuLogoBackgroundColorOpacity={menuLogoBackgroundColorOpacity}
          />

          <div ref={slotRef} className="relative min-w-0 flex-1">
            <ul
              ref={measureRef}
              aria-hidden
              className={
                "pointer-events-none invisible absolute left-0 top-0 flex " +
                "gap-3 whitespace-nowrap pl-4 text-sm"
              }
            >
              {items.map((item) => (
                <li key={`measure-${item.href}`}>
                  <span className={APP_NAV_LINK_BASE_CLASS}>{item.label}</span>
                </li>
              ))}
            </ul>

            {showDesktopLinks ? (
              <ul className="flex gap-3 overflow-hidden pl-4 text-sm">
                {items.map((item) => (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={
                        isAppNavLinkActive(pathname, item.href)
                          ? "page"
                          : undefined
                      }
                      className={appNavLinkClass(
                        isAppNavLinkActive(pathname, item.href),
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <AppNavUserMenu
            userName={userName}
            avatarUrl={avatarUrl}
            profileHref={profileHref}
            accountExtras={
              showTotemSwitch ? <TotemModeSwitch enabled={totemMode} /> : null
            }
            onSignOut={handleSignOut}
          />
        </nav>
      </header>

      <div className={APP_NAV_HEIGHT_CLASS} aria-hidden />

      <AppNavMobileMenu
        open={effectiveMenuOpen}
        items={items}
        onOpenChange={setMenuOpen}
      />
    </>
  );
}
