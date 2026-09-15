import { auth } from "@/auth";
import { adjustColaboratorBalance } from "@/app/(app)/balance-adjustment-actions";
import { StaffDashboardView } from "@/components/dashboard/staff-dashboard-view";
import type { Role } from "@/lib/auth/nav";
import { loadColaboratorOptions } from "@/lib/dashboard/load-colaborator-options";

interface DashboardPageProps {
  searchParams: Promise<{ colaborator?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const params = await searchParams;

  const colaboratorOptions = await loadColaboratorOptions(role);

  return (
    <StaffDashboardView
      role={role}
      sessionUserId={session?.user?.id}
      colaboratorParam={params.colaborator}
      colaboratorOptions={colaboratorOptions}
      onAdjustBalance={adjustColaboratorBalance}
    />
  );
}
