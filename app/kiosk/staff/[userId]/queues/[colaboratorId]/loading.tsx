import { QueuesColaboratorPageSkeleton } from "@/components/queues/queues-colaborator-page-skeleton";
import { KioskContentSurface } from "@/components/kiosk/kiosk-content-surface";

export default function KioskStaffQueueColaboratorLoading() {
  return (
    <KioskContentSurface>
      <QueuesColaboratorPageSkeleton />
    </KioskContentSurface>
  );
}
