import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { loadKioskStaffActor } from "@/lib/business/kiosk-staff-access";
import { canViewQueues } from "@/lib/auth/permissions";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ userId: string }>;
}

export default async function KioskQueuesSectionLayout({
  children,
  params,
}: LayoutProps) {
  const { userId } = await params;
  const actor = await loadKioskStaffActor(userId);
  if (!actor) notFound();

  if (!canViewQueues(actor.staffRole)) {
    return <ForbiddenMessage />;
  }

  return children;
}
