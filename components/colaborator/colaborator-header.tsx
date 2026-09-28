"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

import { AppBrandLink } from "@/components/app-brand-link";
import { AppNavMobileMenu } from "@/components/app-nav-mobile-menu";
import { AppNavUserMenu } from "@/components/app-nav-user-menu";
import { TotemModeSwitch } from "@/components/nav/totem-mode-switch";
import { Button } from "@/components/ui/button";
import { useMeasuredNavLayout } from "@/hooks/use-measured-nav-layout";
import { navItemsForRole, type Role } from "@/lib/auth/nav";
import { canAccessOwnProfile } from "@/lib/auth/profile-access";
import { buildProfilePath } from "@/lib/profile/profile-path";
import { cn } from "@/lib/utils";

const COLAB_NAV_LINK_BASE =
  "inline-flex min-h-9 items-center rounded-md px-2.5 py-1 text-sm " +
  "font-medium sm:px-3";

/** Matches the fixed bar so page content starts below it. */
const COLAB_HEADER_HEIGHT_CLASS = "h-16";

export interface ColaboratorHeaderProps {
  homeHref?: string;
  logoUrl?: string | null;
  menuLogoBackgroundColor?: string | null;
  menuLogoBackgroundColorOpacity?: number | null;
  totemMode?: boolean;
  showTotemSwitch?: boolean;
}

export function ColaboratorHeader({
  homeHref = "/",
  logoUrl = null,
  menuLogoBackgroundColor = null,
  menuLogoBackgroundColorOpacity = null,
  totemMode = false,
  showTotemSwitch = false,
}: ColaboratorHeaderProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "colaborator") as Role;
  const userId = session?.user?.id;
  const userName = session?.user?.name ?? t("profile.title");
  const avatarUrl = session?.user?.avatarUrl ?? null;
  const profileHref =
    canAccessOwnProfile(role) && userId && !totemMode
      ? buildProfilePath(userId)
      : null;
  const menuItems = navItemsForRole(role, { userId, totemMode }).map((item) => ({
    href: item.href,
    label: t(`nav.${item.labelKey}`),
  }));
  const [menuOpen, setMenuOpen] = useState(false);
  const measureKey = menuItems.map((item) => item.href).join("|");
  const { slotRef, measureRef, layoutMode } = useMeasuredNavLayout(measureKey);
  const showNav = !totemMode && menuItems.length > 0;
  const showHamburger = showNav && layoutMode !== "desktop";
  const showDesktopLinks = showNav && layoutMode === "desktop";

  function handleSignOut(): void {
    void signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      <header
        className={
          "fixed inset-x-0 top-0 z-50 flex items-center justify-between " +
          `gap-3 border-b bg-card px-4 shadow-sm ${COLAB_HEADER_HEIGHT_CLASS}`
        }
      >
        {showHamburger ? (
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
        ) : null}

        <AppBrandLink
          href={homeHref}
          logoUrl={logoUrl}
          menuLogoBackgroundColor={menuLogoBackgroundColor}
          menuLogoBackgroundColorOpacity={menuLogoBackgroundColorOpacity}
          nameClassName="text-lg"
        />

        <div ref={slotRef} className="relative min-w-0 flex-1">
          {showNav ? (
            <ul
              ref={measureRef}
              aria-hidden
              className={
                "pointer-events-none invisible absolute left-0 top-0 flex " +
                "gap-2 whitespace-nowrap"
              }
            >
              {menuItems.map((item) => (
                <li key={`measure-${item.href}`}>
                  <span className={COLAB_NAV_LINK_BASE}>{item.label}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {showDesktopLinks ? (
            <nav
              aria-label={t("nav.menuTitle")}
              className="flex justify-center"
            >
              <ul className="flex items-center justify-center gap-1 sm:gap-2">
                {menuItems.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== `/${userId}` &&
                      pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          COLAB_NAV_LINK_BASE,
                          "transition-colors",
                          active
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 " +
                              "hover:text-foreground",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
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
      </header>

      <div className={COLAB_HEADER_HEIGHT_CLASS} aria-hidden />

      <AppNavMobileMenu
        open={menuOpen && showHamburger}
        items={menuItems}
        onOpenChange={setMenuOpen}
        linkActiveOptions={
          userId ? { exactMatchHrefs: [`/${userId}`] } : undefined
        }
      />
    </>
  );
}
