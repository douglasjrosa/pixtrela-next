"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

import { AppNavMobileMenu } from "@/components/app-nav-mobile-menu";
import { AppNavUserMenu } from "@/components/app-nav-user-menu";
import { Button } from "@/components/ui/button";
import { canAccessOwnProfile } from "@/lib/auth/profile-access";
import { homeHrefForRole, navItemsForRole, type Role } from "@/lib/auth/nav";
import {
  resolveNavLayoutMode,
  type NavLayoutMode,
} from "@/lib/auth/nav-layout";
import { buildProfilePath } from "@/lib/profile/profile-path";

export const APP_NAV_HEIGHT_CLASS = "h-14";

export function AppNav() {
  const t = useTranslations();
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "colaborator") as Role;
  const userId = session?.user?.id;
  const userName = session?.user?.name ?? t("profile.title");
  const avatarUrl = session?.user?.avatarUrl ?? null;
  const items = navItemsForRole(role, { userId });
  const homeHref = homeHrefForRole(role, userId);
  const profileHref =
    canAccessOwnProfile(role) && userId ? buildProfilePath(userId) : null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<NavLayoutMode>("desktop");

  const slotRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLUListElement>(null);

  const updateLayoutMode = useCallback((): void => {
    const slot = slotRef.current;
    const measure = measureRef.current;
    if (!slot || !measure) return;

    setLayoutMode(
      resolveNavLayoutMode({
        viewportWidth: window.innerWidth,
        availableWidth: slot.clientWidth,
        requiredWidth: measure.scrollWidth,
      }),
    );
  }, []);

  useLayoutEffect(() => {
    updateLayoutMode();
  }, [updateLayoutMode, items]);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    window.addEventListener("resize", updateLayoutMode);

    if (typeof ResizeObserver === "undefined") {
      return () => {
        window.removeEventListener("resize", updateLayoutMode);
      };
    }

    const observer = new ResizeObserver(() => {
      updateLayoutMode();
    });
    observer.observe(slot);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateLayoutMode);
    };
  }, [updateLayoutMode]);

  const effectiveMenuOpen = menuOpen && layoutMode !== "desktop";

  function handleSignOut(): void {
    void signOut({ callbackUrl: "/login" });
  }

  const showDesktopLinks = layoutMode === "desktop";

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
          {!showDesktopLinks ? (
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

          <Link href={homeHref} className="shrink-0 font-bold">
            {t("app.name")}
          </Link>

          <div ref={slotRef} className="relative min-w-0 flex-1">
            <ul
              ref={measureRef}
              aria-hidden
              className={
                "pointer-events-none invisible absolute left-0 top-0 flex " +
                "gap-3 whitespace-nowrap text-sm"
              }
            >
              {items.map((item) => (
                <li key={`measure-${item.href}`}>
                  <span className="inline-flex items-center px-2 py-1">
                    {t(`nav.${item.labelKey}`)}
                  </span>
                </li>
              ))}
            </ul>

            {showDesktopLinks ? (
              <ul className="flex gap-3 overflow-hidden text-sm">
                {items.map((item) => (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      className={
                        "inline-flex items-center rounded-md px-2 py-1 " +
                        "transition-colors hover:bg-muted hover:text-foreground"
                      }
                    >
                      {t(`nav.${item.labelKey}`)}
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
