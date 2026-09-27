import { getTranslations } from "next-intl/server";

import { getAppSession } from "@/lib/auth/app-session";
import { AppNavClient } from "@/components/app-nav-client";
import { canAccessOwnProfile } from "@/lib/auth/profile-access";
import {
  homeHrefForRole,
  navItemsForRole,
  resolveNavItemLabels,
  type Role,
} from "@/lib/auth/nav";
import { loadSessionTotemMode } from "@/lib/auth/totem-mode-state";
import { buildProfilePath } from "@/lib/profile/profile-path";

export { APP_NAV_HEIGHT_CLASS } from "@/components/app-nav-client";

export interface AppNavProps {
  logoUrl?: string | null;
  menuLogoBackgroundColor?: string | null;
  menuLogoBackgroundColorOpacity?: number | null;
}

export async function AppNav({
  logoUrl = null,
  menuLogoBackgroundColor = null,
  menuLogoBackgroundColorOpacity = null,
}: AppNavProps) {
  const session = await getAppSession();
  const role = (session?.user?.role ?? "colaborator") as Role;
  const userId = session?.user?.id;
  const tNav = await getTranslations("nav");
  const tProfile = await getTranslations("profile");
  const totemMode = await loadSessionTotemMode(userId);
  const showTotemSwitch = canAccessOwnProfile(role) && Boolean(userId);
  const items = navItemsForRole(role, { userId, totemMode });
  const resolvedItems = resolveNavItemLabels(items, {
    panel: tNav("panel"),
    board: tNav("board"),
    tasks: tNav("tasks"),
    teams: tNav("teams"),
    awards: tNav("awards"),
    settings: tNav("settings"),
    dashboard: tNav("dashboard"),
    store: tNav("store"),
    exchange: tNav("exchange"),
    profile: tNav("profile"),
  });
  const homeHref = homeHrefForRole(role, userId, { totemMode });
  const profileHref =
    canAccessOwnProfile(role) && userId && !totemMode
      ? buildProfilePath(userId)
      : null;
  const userName = session?.user?.name ?? tProfile("title");

  return (
    <AppNavClient
      logoUrl={logoUrl}
      menuLogoBackgroundColor={menuLogoBackgroundColor}
      menuLogoBackgroundColorOpacity={menuLogoBackgroundColorOpacity}
      homeHref={homeHref}
      profileHref={profileHref}
      userName={userName}
      avatarUrl={session?.user?.avatarUrl ?? null}
      items={resolvedItems}
      totemMode={totemMode}
      showTotemSwitch={showTotemSwitch}
    />
  );
}
