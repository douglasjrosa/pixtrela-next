import { Suspense, type ReactNode } from "react";

import { KioskQueueLiberadasBlock } from "@/components/kiosk/kiosk-queue-liberadas-block";
import { KioskQueuePageComposer } from "@/components/kiosk/kiosk-queue-page-composer";
import { KioskQueueProducingBlock } from "@/components/kiosk/kiosk-queue-producing-block";
import { KioskQueueProfileBlock } from "@/components/kiosk/kiosk-queue-profile-block";
import { KioskQueueSkeletonList } from "@/components/kiosk/kiosk-queue-card-skeleton";
import { loadKioskSettings } from "@/lib/kiosk/load-session-idle";
import { emptyKioskQueueSectionPage } from "@/lib/repos/kiosk-subtasks";

function HeaderChipSkeleton() {
  return (
    <div className="flex max-w-[min(100%,14rem)] items-center gap-2 rounded-lg border px-2 py-2">
      <div
        className="size-10 shrink-0 animate-pulse rounded-full bg-muted"
        aria-hidden
      />
      <div className="h-5 w-24 animate-pulse rounded bg-muted" aria-hidden />
    </div>
  );
}

export async function KioskQueueColaboratorPage({
  colaboratorId,
  readOnly = false,
  staffUserId,
  allowFaceEdit = false,
  backHref,
  toolbarTopRadiusClass,
  headerClassName,
  profileShowEdit,
}: {
  colaboratorId: string;
  readOnly?: boolean;
  staffUserId?: string;
  allowFaceEdit?: boolean;
  backHref?: string;
  toolbarTopRadiusClass?: string;
  headerClassName?: string;
  profileShowEdit?: boolean;
}): Promise<ReactNode> {
  const settings = await loadKioskSettings();
  const showEdit = profileShowEdit ?? Boolean(allowFaceEdit && !readOnly);

  return (
    <KioskQueuePageComposer
      colaboratorId={colaboratorId}
      colaboratorName=""
      initialLiberadas={emptyKioskQueueSectionPage(settings.queuePageSize)}
      maxSimultaneousSubtaskIntervalSeconds={
        settings.maxSimultaneousSubtaskIntervalSeconds
      }
      readOnly={readOnly}
      staffUserId={staffUserId}
      allowFaceEdit={allowFaceEdit}
      backHref={backHref}
      toolbarTopRadiusClass={toolbarTopRadiusClass}
      bootstrapPending
      profileSlot={
        <Suspense fallback={<HeaderChipSkeleton />}>
          <KioskQueueProfileBlock
            colaboratorId={colaboratorId}
            showEdit={showEdit}
            className={headerClassName}
          />
        </Suspense>
      }
    >
      <Suspense fallback={<KioskQueueSkeletonList count={1} />}>
        <KioskQueueProducingBlock
          colaboratorId={colaboratorId}
          liveChainIntervalSeconds={
            settings.maxSimultaneousSubtaskIntervalSeconds
          }
          queuePageSize={settings.queuePageSize}
        />
      </Suspense>
      <Suspense
        fallback={<KioskQueueSkeletonList count={settings.queuePageSize} />}
      >
        <KioskQueueLiberadasBlock
          colaboratorId={colaboratorId}
          liveChainIntervalSeconds={
            settings.maxSimultaneousSubtaskIntervalSeconds
          }
          queuePageSize={settings.queuePageSize}
        />
      </Suspense>
    </KioskQueuePageComposer>
  );
}
