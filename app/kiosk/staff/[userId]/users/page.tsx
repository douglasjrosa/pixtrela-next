import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { KioskContentSurface } from "@/components/kiosk/kiosk-content-surface";
import { KioskStaffUsersPanel } from "@/components/kiosk/kiosk-staff-users-panel";
import {
  APP_LIST_PAGE_SHELL_CLASS,
  APP_LIST_PAGE_TITLE_CLASS,
} from "@/components/layout/app-page-layout";
import {
  canKioskSignOutDevice,
  loadKioskStaffActor,
} from "@/lib/business/kiosk-staff-access";
import { canViewUsers } from "@/lib/auth/permissions";
import { loadKioskStaffColaborators } from "@/lib/kiosk/load-staff-colaborators";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function KioskStaffUsersPage({ params }: PageProps) {
  const { userId } = await params;
  const actor = await loadKioskStaffActor(userId);
  if (!actor) notFound();

  if (!canViewUsers(actor.staffRole)) {
    return <ForbiddenMessage />;
  }

  const [colaborators, tKiosk] = await Promise.all([
    loadKioskStaffColaborators(),
    getTranslations("kiosk"),
  ]);

  return (
    <KioskContentSurface>
      <section className={APP_LIST_PAGE_SHELL_CLASS}>
        <h1 className={APP_LIST_PAGE_TITLE_CLASS}>{tKiosk("usersPage")}</h1>
        <KioskStaffUsersPanel
          userId={userId}
          colaborators={colaborators}
          canSignOut={canKioskSignOutDevice(actor.staffRole)}
        />
      </section>
    </KioskContentSurface>
  );
}
