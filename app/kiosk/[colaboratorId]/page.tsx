import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { loadKioskColaboratorProfile } from "@/lib/kiosk/load-colaborator-profile";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { listAssignedSubTasks } from "@/lib/repos/kiosk-subtasks";

import { KioskPanelClient } from "./kiosk-panel-client";

interface PageProps {
  params: Promise<{ colaboratorId: string }>;
}

async function loadAssignedSubTasks(colaboratorId: string) {
  try {
    return await listAssignedSubTasks(colaboratorId);
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function KioskColaboratorPage({ params }: PageProps) {
  const { colaboratorId } = await params;
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const readOnly = role === "admin";
  const [subTasks, profile] = await Promise.all([
    loadAssignedSubTasks(colaboratorId),
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
