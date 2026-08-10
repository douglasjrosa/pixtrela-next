import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canAccessOwnProfile } from "@/lib/auth/profile-access";
import { isAuthenticatedSession } from "@/lib/auth/session";
import { isDrizzleBackend } from "@/lib/db/backend";
import { findUserAvatarUrl } from "@/lib/repos/users";
import { toBrowserMediaUrl } from "@/lib/strapi/browser-media-url";
import { strapiFetch } from "@/lib/strapi";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";

/** Server-only profile avatar load (not a Server Action). */
export async function loadOwnProfileAvatar(): Promise<string | null> {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;
  if (!isAuthenticatedSession(session) || !canAccessOwnProfile(role) || !userId) {
    return null;
  }

  if (isDrizzleBackend()) {
    try {
      const url = await findUserAvatarUrl(userId);
      return url ? toBrowserMediaUrl(url) : null;
    } catch {
      return null;
    }
  }

  if (!session.jwt) return null;

  try {
    const me = await strapiFetch<{
      avatar?: { url?: string } | null;
    }>(
      "/users/me",
      {
        strapiCache: { noStore: true },
      },
      {
        populate: { avatar: { fields: ["url"] } },
      },
    );
    return resolveStrapiMediaUrl(me.avatar?.url ?? null);
  } catch {
    return null;
  }
}
