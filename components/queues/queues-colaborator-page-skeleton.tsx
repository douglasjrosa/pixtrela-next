import { getTranslations } from "next-intl/server";

import { APP_CONTENT_HEIGHT_CLASS } from "@/components/layout/app-page-layout";
import { KioskQueueSkeletonList } from "@/components/kiosk/kiosk-queue-card-skeleton";
import { cn } from "@/lib/utils";

export async function QueuesColaboratorPageSkeleton() {
  const t = await getTranslations("kiosk");
  const tCommon = await getTranslations("common");

  return (
    <section
      className={cn(APP_CONTENT_HEIGHT_CLASS, "flex flex-col")}
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className={
          "sticky top-0 z-30 shrink-0 border-b bg-background/95 " +
          "backdrop-blur-sm px-4 py-3 rounded-t-2xl sm:rounded-t-2xl"
        }
      >
        <div className="flex items-center justify-between gap-3">
          <div
            className="h-9 w-16 animate-pulse rounded-md bg-muted"
            aria-hidden
          />
          <div className="flex max-w-[min(100%,14rem)] items-center gap-2 rounded-lg border px-2 py-2">
            <div
              className="size-10 shrink-0 animate-pulse rounded-full bg-muted"
              aria-hidden
            />
            <div
              className="h-5 w-24 animate-pulse rounded bg-muted"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t("sectionUnlocked")}</h2>
          <KioskQueueSkeletonList count={3} />
        </div>

        <div className="space-y-2">
          <div
            className="flex h-11 w-full animate-pulse items-center rounded-lg border bg-muted/40 px-4"
            aria-hidden
          />
          <span className="sr-only">{t("sectionLocked")}</span>
        </div>

        <div className="space-y-2">
          <div
            className="flex h-11 w-full animate-pulse items-center rounded-lg border bg-muted/40 px-4"
            aria-hidden
          />
          <span className="sr-only">{t("sectionFinishedToday")}</span>
        </div>
      </div>

      <span className="sr-only">{tCommon("loading")}</span>
    </section>
  );
}
