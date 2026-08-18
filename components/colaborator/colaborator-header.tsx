"use client";

import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

import { AppBrandLink } from "@/components/app-brand-link";
import { AppNavUserMenu } from "@/components/app-nav-user-menu";
import type { Role } from "@/lib/auth/nav";
import { canAccessOwnProfile } from "@/lib/auth/profile-access";
import { buildProfilePath } from "@/lib/profile/profile-path";

export interface ColaboratorHeaderProps {
  homeHref?: string;
}

export function ColaboratorHeader({ homeHref = "/" }: ColaboratorHeaderProps) {
  const t = useTranslations();
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "colaborator") as Role;
  const userId = session?.user?.id;
  const userName = session?.user?.name ?? t("profile.title");
  const avatarUrl = session?.user?.avatarUrl ?? null;
  const profileHref =
    canAccessOwnProfile(role) && userId ? buildProfilePath(userId) : null;

  function handleSignOut(): void {
    void signOut({ callbackUrl: "/login" });
  }

  return (
    <header
      className={
        "relative z-10 flex items-center justify-between border-b " +
        "bg-card px-4 py-3 shadow-sm"
      }
    >
      <AppBrandLink href={homeHref} nameClassName="text-lg" />
      <AppNavUserMenu
        userName={userName}
        avatarUrl={avatarUrl}
        profileHref={profileHref}
        onSignOut={handleSignOut}
      />
    </header>
  );
}
