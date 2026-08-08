import { auth } from "@/auth";
import { canAccessOwnProfile } from "@/lib/auth/profile-access";
import type { Role } from "@/lib/auth/nav";
import { strapiFetch } from "@/lib/strapi";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";

/** Server-only profile avatar load (not a Server Action). */
export async function loadOwnProfileAvatar(): Promise<string | null> {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (!session?.jwt || !canAccessOwnProfile(role)) {
    return null;
  }

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
