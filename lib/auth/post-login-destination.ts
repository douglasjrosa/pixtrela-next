import { KIOSK_HOME_PATH } from "@/lib/auth/colaborator-routes";
import type { Role } from "@/lib/auth/nav";

export function resolvePostLoginDestination(
  role: Role | undefined,
  userId: string | undefined,
  callbackUrl: string | null,
): string {
  if (role === "kiosk") return KIOSK_HOME_PATH;
  if (role === "colaborator" && userId) return `/${userId}`;
  if (callbackUrl?.startsWith("/")) return callbackUrl;
  return "/";
}
