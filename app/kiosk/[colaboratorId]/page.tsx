import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { loadAssignedSubTasksForColaborator } from "@/lib/kiosk/load-assigned-subtasks";
import { loadKioskColaboratorProfile } from "@/lib/kiosk/load-colaborator-profile";

import { KioskPanelClient } from "./kiosk-panel-client";

interface PageProps {
  params: Promise<{ colaboratorId: string }>;
}

export default async function KioskColaboratorPage({ params }: PageProps) {
  const { colaboratorId } = await params;
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const readOnly = role === "admin";
  const [subTasks, profile] = await Promise.all([
    loadAssignedSubTasksForColaborator(colaboratorId),
    loadKioskColaboratorProfile(colaboratorId),
  ]);

  return (
    <KioskPanelClient
      colaboratorId={colaboratorId}
      colaboratorName={profile?.name ?? ""}
      avatarUrl={profile?.avatarUrl ?? null}
      subTasks={subTasks}
      readOnly={readOnly}
    />
  );
}
