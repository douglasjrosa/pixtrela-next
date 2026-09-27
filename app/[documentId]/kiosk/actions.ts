"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAppSession } from "@/lib/auth/app-session";
import { homeHrefForRole, type Role } from "@/lib/auth/nav";
import { canAccessOwnProfile } from "@/lib/auth/profile-access";
import {
  TOTEM_MODE_COOKIE_NAME,
  totemModeCookieOptions,
} from "@/lib/auth/totem-mode-cookie";
import { buildUserKioskPath } from "@/lib/auth/user-kiosk-path";

/** Turns personal totem lock on or off for the signed-in producer. */
export async function setPersonalTotemMode(enabled: boolean): Promise<void> {
  const session = await getAppSession();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;

  if (!userId || !role || !canAccessOwnProfile(role)) {
    throw new Error("forbidden");
  }

  const store = await cookies();
  if (enabled) {
    store.set(TOTEM_MODE_COOKIE_NAME, userId, totemModeCookieOptions());
    redirect(buildUserKioskPath(userId));
  }

  store.set(TOTEM_MODE_COOKIE_NAME, "", {
    ...totemModeCookieOptions(),
    maxAge: 0,
  });
  redirect(homeHrefForRole(role, userId));
}
