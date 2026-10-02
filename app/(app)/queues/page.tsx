import { getAppSession } from "@/lib/auth/app-session";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { KioskStaffQueuesPanel } from "@/components/kiosk/kiosk-staff-queues-panel";
import { QueuesRevisionRefresh } from "@/components/queues/queues-revision-refresh";
import type { KioskStaffRole } from "@/lib/business/kiosk-staff-access";
import { loadStaffQueuesGrouped } from "@/lib/kiosk/load-staff-queues-grouped";
import { loadTaskAutomationSetting } from "@/lib/settings/load-task-automation";
import type { Role } from "@/lib/auth/nav";
import { canViewQueues } from "@/lib/auth/permissions";

export default async function AppQueuesPage() {
  const session = await getAppSession();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;

  if (!userId || !canViewQueues(role)) {
    return <ForbiddenMessage />;
  }

  const staffRole = role as KioskStaffRole;
  const [{ teams }, automation] = await Promise.all([
    loadStaffQueuesGrouped(userId, staffRole),
    loadTaskAutomationSetting(),
  ]);

  return (
    <>
      <QueuesRevisionRefresh />
      <KioskStaffQueuesPanel
        teams={teams}
        colaboratorLinkTarget="app"
        assignWarnMax={automation.assignWarnMax}
      />
    </>
  );
}
