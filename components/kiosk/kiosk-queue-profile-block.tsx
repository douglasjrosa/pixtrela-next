import { loadKioskColaboratorProfile } from "@/lib/kiosk/load-colaborator-profile";

import { KioskQueueProfileSeed } from "./kiosk-queue-seeds";

export async function KioskQueueProfileBlock({
  colaboratorId,
  showEdit = false,
  className,
}: {
  colaboratorId: string;
  showEdit?: boolean;
  className?: string;
}) {
  const profile = await loadKioskColaboratorProfile(colaboratorId);
  return (
    <KioskQueueProfileSeed
      name={profile?.name ?? ""}
      avatarUrl={profile?.avatarUrl ?? null}
      showEdit={showEdit}
      className={className}
    />
  );
}
