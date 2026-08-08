import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ProfileClient } from "@/components/profile/profile-client";
import { canAccessOwnProfile } from "@/lib/auth/profile-access";
import type { Role } from "@/lib/auth/nav";
import { buildProfilePath } from "@/lib/profile/profile-path";

import { loadOwnProfileAvatar, loadOwnProfilePersonal } from "./actions";

interface PageProps {
  params: Promise<{ documentId: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const session = await auth();
  const { documentId } = await params;
  const role = session?.user?.role as Role | undefined;

  if (!session?.user?.id || !canAccessOwnProfile(role)) {
    redirect("/");
  }

  if (session.user.id !== documentId) {
    redirect(buildProfilePath(session.user.id));
  }

  const [avatarUrl, personal] = await Promise.all([
    loadOwnProfileAvatar(),
    loadOwnProfilePersonal(),
  ]);

  const displayName =
    [personal.name, personal.lastName].filter(Boolean).join(" ").trim() ||
    session.user.name ||
    "";

  return (
    <ProfileClient
      userName={displayName}
      avatarUrl={avatarUrl}
      personal={personal}
    />
  );
}
