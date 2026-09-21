import { notFound } from "next/navigation";

import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { KioskQueueColaboratorPage } from "@/components/kiosk/kiosk-queue-colaborator-page";
import { APP_CONTENT_HEIGHT_CLASS } from "@/components/layout/app-page-layout";
import { cn } from "@/lib/utils";
import { appQueuesPath } from "@/lib/business/app-queues-paths";
import { isKioskStaffRole } from "@/lib/business/kiosk-staff-access";
import { getAppSession } from "@/lib/auth/app-session";
import type { Role } from "@/lib/auth/nav";
import { assertStaffCanManageColaborator } from "@/lib/repos/kiosk";
import { loadQueuesToolbarTopRadiusClass } from "@/lib/themes/load-queues-route-toolbar";

interface PageProps {
  params: Promise<{ colaboratorId: string }>;
}

export default async function AppQueueColaboratorPage({ params }: PageProps) {
  const session = await getAppSession();
  const role = session?.user?.role as Role | undefined;
  const staffUserId = session?.user?.id;

  if (!staffUserId || !isKioskStaffRole(role)) {
    return <ForbiddenMessage />;
  }

  const { colaboratorId } = await params;

  try {
    await assertStaffCanManageColaborator(staffUserId, colaboratorId);
  } catch {
    notFound();
  }

  const toolbarTopRadiusClass = await loadQueuesToolbarTopRadiusClass();

  return (
    <section className={cn(APP_CONTENT_HEIGHT_CLASS, "flex flex-col")}>
      <KioskQueueColaboratorPage
        colaboratorId={colaboratorId}
        staffUserId={staffUserId}
        allowFaceEdit
        backHref={appQueuesPath()}
        toolbarTopRadiusClass={toolbarTopRadiusClass}
        headerClassName="max-w-[min(100%,14rem)] shrink-0"
      />
    </section>
  );
}
