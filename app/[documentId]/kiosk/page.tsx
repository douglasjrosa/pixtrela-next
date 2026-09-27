import { redirect } from "next/navigation";

import { KioskQueueColaboratorPage } from "@/components/kiosk/kiosk-queue-colaborator-page";
import { getAppSession } from "@/lib/auth/app-session";
import type { Role } from "@/lib/auth/nav";
import { canAccessOwnProfile } from "@/lib/auth/profile-access";
import { buildUserKioskPath } from "@/lib/auth/user-kiosk-path";

interface PageProps {
  params: Promise<{ documentId: string }>;
}

export default async function UserKioskPage({ params }: PageProps) {
  const session = await getAppSession();
  const { documentId } = await params;
  const role = session?.user?.role as Role | undefined;

  if (!session?.user?.id || !canAccessOwnProfile(role)) {
    redirect("/");
  }

  if (session.user.id !== documentId) {
    redirect(buildUserKioskPath(session.user.id));
  }

  return (
    <KioskQueueColaboratorPage
      colaboratorId={documentId}
      headerClassName="w-full"
    />
  );
}
