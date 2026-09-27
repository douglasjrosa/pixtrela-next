import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { KioskContentSurface } from "@/components/kiosk/kiosk-content-surface";
import { KioskStaffUsersPanel } from "@/components/kiosk/kiosk-staff-users-panel";
import {
  APP_LIST_PAGE_SHELL_CLASS,
  APP_LIST_PAGE_TITLE_CLASS,
} from "@/components/layout/app-page-layout";
import { canManageColaboratorCredentialsOnKiosk } from "@/lib/auth/kiosk-credentials-access";
import {
  canKioskSignOutDevice,
  loadKioskStaffActor,
} from "@/lib/business/kiosk-staff-access";
import { loadTeamColaboratorsForStaff } from "@/lib/kiosk/load-team-colaborators-for-staff";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function KioskStaffTeamAccessPage({ params }: PageProps) {
  const { userId } = await params;
  const actor = await loadKioskStaffActor(userId);
  if (!actor) notFound();

  if (!canManageColaboratorCredentialsOnKiosk(actor.staffRole)) {
    return <ForbiddenMessage />;
  }

  const [colaborators, tKiosk] = await Promise.all([
    loadTeamColaboratorsForStaff(actor.staffUserId, actor.staffRole),
    getTranslations("kiosk"),
  ]);

  return (
    <KioskContentSurface>
      <section className={APP_LIST_PAGE_SHELL_CLASS}>
        <h1 className={APP_LIST_PAGE_TITLE_CLASS}>{tKiosk("teamAccessPage")}</h1>
        <KioskStaffUsersPanel
          userId={userId}
          colaborators={colaborators}
          canSignOut={canKioskSignOutDevice(actor.staffRole)}
        />
      </section>
    </KioskContentSurface>
  );
}
