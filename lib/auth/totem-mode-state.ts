import { cookies } from "next/headers";

import {
  TOTEM_MODE_COOKIE_NAME,
  resolveTotemMode,
} from "@/lib/auth/totem-mode-cookie";

/** Reads the personal totem cookie for the current request. */
export async function loadSessionTotemMode(
  sessionUserId?: string,
): Promise<boolean> {
  const store = await cookies();
  return resolveTotemMode(
    store.get(TOTEM_MODE_COOKIE_NAME)?.value,
    sessionUserId,
  );
}
