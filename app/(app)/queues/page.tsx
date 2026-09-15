import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { KioskStaffQueuesPanel } from "@/components/kiosk/kiosk-staff-queues-panel";
import {
  APP_LIST_PAGE_SHELL_CLASS,
  APP_LIST_PAGE_TITLE_CLASS,
} from "@/components/layout/app-page-layout";
import { appQueueColaboratorPath } from "@/lib/business/app-queues-paths";
import type { KioskStaffRole } from "@/lib/business/kiosk-staff-access";
import { loadStaffQueuesGrouped } from "@/lib/kiosk/load-staff-queues-grouped";
import type { Role } from "@/lib/auth/nav";
import { canViewQueues } from "@/lib/auth/permissions";

export default async function AppQueuesPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;

  if (!userId || !canViewQueues(role)) {
    return <ForbiddenMessage />;
  }

  const staffRole = role as KioskStaffRole;
  const { teams } = await loadStaffQueuesGrouped(userId, staffRole);
  const tKiosk = await getTranslations("kiosk");

  return (
    <section className={APP_LIST_PAGE_SHELL_CLASS}>
      <h1 className={APP_LIST_PAGE_TITLE_CLASS}>{tKiosk("queuesPage")}</h1>
      <KioskStaffQueuesPanel
        teams={teams}
        colaboratorHref={appQueueColaboratorPath}
      />
    </section>
  );
}
