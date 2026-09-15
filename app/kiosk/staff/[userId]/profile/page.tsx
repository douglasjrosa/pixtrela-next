import { notFound } from "next/navigation";

import {
  changeStaffPassword,
  updateStaffAvatar,
  updateStaffPersonal,
} from "@/app/kiosk/staff/[userId]/profile/actions";
import { KioskContentSurface } from "@/components/kiosk/kiosk-content-surface";
import { ProfileClient } from "@/components/profile/profile-client";
import { loadKioskStaffActor } from "@/lib/business/kiosk-staff-access";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { findUserAvatarUrl, findUserById } from "@/lib/repos/users";
import type { UpdateOwnPersonalInput } from "@/lib/schemas/profile";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function KioskStaffProfilePage({ params }: PageProps) {
  const { userId } = await params;
  const actor = await loadKioskStaffActor(userId);
  if (!actor) notFound();

  const [user, avatarUrl] = await Promise.all([
    findUserById(actor.staffUserId),
    findUserAvatarUrl(actor.staffUserId),
  ]);
  if (!user) notFound();

  const personal: UpdateOwnPersonalInput = {
    name: user.name ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
  };

  const displayName =
    [personal.name, personal.lastName].filter(Boolean).join(" ").trim() ||
    actor.name ||
    "";

  return (
    <KioskContentSurface>
      <ProfileClient
        userName={displayName}
        avatarUrl={avatarUrl ? toBrowserMediaUrl(avatarUrl) : null}
        personal={personal}
        actions={{
          changePassword: changeStaffPassword.bind(null, actor.staffUserId),
          updateAvatar: updateStaffAvatar.bind(null, actor.staffUserId),
          updatePersonal: updateStaffPersonal.bind(null, actor.staffUserId),
        }}
      />
    </KioskContentSurface>
  );
}
