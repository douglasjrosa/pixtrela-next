import { getAppSession } from "@/lib/auth/app-session";
import { KioskContentSurface } from "@/components/kiosk/kiosk-content-surface";
import { KioskQueueColaboratorPage } from "@/components/kiosk/kiosk-queue-colaborator-page";
import type { Role } from "@/lib/auth/nav";

interface PageProps {
  params: Promise<{ colaboratorId: string }>;
}

export default async function KioskColaboratorPage({ params }: PageProps) {
  const { colaboratorId } = await params;
  const session = await getAppSession();
  const role = session?.user?.role as Role | undefined;
  const readOnly = role === "admin";

  return (
    <KioskContentSurface>
      <KioskQueueColaboratorPage
        colaboratorId={colaboratorId}
        readOnly={readOnly}
        headerClassName="w-full"
      />
    </KioskContentSurface>
  );
}
