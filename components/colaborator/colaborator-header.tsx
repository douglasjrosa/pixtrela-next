"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

import { AppBrandLink } from "@/components/app-brand-link";
import { AppNavUserMenu } from "@/components/app-nav-user-menu";
import { colaboratorMenuItems, type Role } from "@/lib/auth/nav";
import { canAccessOwnProfile } from "@/lib/auth/profile-access";
import { buildProfilePath } from "@/lib/profile/profile-path";
import { cn } from "@/lib/utils";

export interface ColaboratorHeaderProps {
  homeHref?: string;
  logoUrl?: string | null;
}

export function ColaboratorHeader({
  homeHref = "/",
  logoUrl = null,
}: ColaboratorHeaderProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "colaborator") as Role;
  const userId = session?.user?.id;
  const userName = session?.user?.name ?? t("profile.title");
  const avatarUrl = session?.user?.avatarUrl ?? null;
  const profileHref =
    canAccessOwnProfile(role) && userId ? buildProfilePath(userId) : null;
  const menuItems = userId ? colaboratorMenuItems(userId) : [];

  function handleSignOut(): void {
    void signOut({ callbackUrl: "/login" });
  }

  return (
    <header
      className={
        "relative z-10 flex items-center justify-between gap-3 border-b " +
        "bg-card px-4 py-3 shadow-sm"
      }
    >
      <AppBrandLink href={homeHref} logoUrl={logoUrl} nameClassName="text-lg" />

      {menuItems.length > 0 ? (
        <nav
          aria-label={t("nav.menuTitle")}
          className="flex min-w-0 flex-1 justify-center"
        >
          <ul className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            {menuItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== `/${userId}` && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-9 items-center rounded-md px-2.5 py-1 " +
                        "text-sm font-medium transition-colors sm:px-3",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {t(`nav.${item.labelKey}`)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      <AppNavUserMenu
        userName={userName}
        avatarUrl={avatarUrl}
        profileHref={profileHref}
        onSignOut={handleSignOut}
      />
    </header>
  );
}
