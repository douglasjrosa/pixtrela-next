"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { usePanelTvPoll } from "@/hooks/use-panel-tv-poll";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { ProductionTvView } from "@/lib/panels/load-panel-tv";
import type { PanelTvCard } from "@/lib/domain/project-panel-tv";
import { cn } from "@/lib/utils";

const PANEL_TV_STATUS_KEYS = [
  "waiting",
  "producing",
  "paused",
  "finished",
  "reviewed",
  "delivered",
] as const;

export interface ProductionTvBoardProps {
  slug: string;
  initial: ProductionTvView;
  poll: (slug: string) => Promise<ProductionTvView | null>;
}

function isKnownStatus(
  status: string,
): status is (typeof PANEL_TV_STATUS_KEYS)[number] {
  return (PANEL_TV_STATUS_KEYS as readonly string[]).includes(status);
}

function TvCard({
  card,
}: {
  card: PanelTvCard;
}) {
  const t = useTranslations("productionTv");
  const statusText = isKnownStatus(card.status)
    ? t(`status.${card.status}`)
    : card.status;
  return (
    <article
      className={cn(
        "rounded-2xl border-2 bg-white p-4 shadow-sm",
        card.producing
          ? "border-[var(--star-gold)] bg-[var(--star-gold-muted)]"
          : "border-border",
        card.overrun && "ring-2 ring-[var(--warning-pause)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold leading-tight text-foreground">
          {card.name}
        </h3>
        {card.overrun ? (
          <span
            className={
              "shrink-0 rounded-full bg-[var(--warning-pause)] px-2 py-0.5 " +
              "text-xs font-semibold"
            }
          >
            {t("overrun")}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 text-sm font-semibold",
          card.producing ? "text-[var(--star-gold-foreground)]" : "text-muted-foreground",
        )}
      >
        {statusText}
      </p>
      <p className="mt-1 text-sm tabular-nums text-muted-foreground">
        {t("progress", {
          done: card.completedSubTasks,
          total: card.totalSubTasks,
        })}
      </p>
    </article>
  );
}

export function ProductionTvBoard({
  slug,
  initial,
  poll,
}: ProductionTvBoardProps) {
  const t = useTranslations("productionTv");
  const [view, setView] = useState(initial);

  const refresh = useCallback(async () => {
    try {
      const next = await poll(slug);
      if (next) setView(next);
    } catch (error) {
      rethrowIfNavigationError(error);
    }
  }, [poll, slug]);

  usePanelTvPoll(refresh);

  const nextHeading =
    view.nextDayKind === "tomorrow" || !view.nextWeekdayKey
      ? t("tomorrow")
      : t(`weekdays.${view.nextWeekdayKey}`);

  return (
    <div className="flex min-h-dvh flex-col gap-6 p-6 text-foreground">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {view.stepName}
          </p>
          <h1 className="font-display text-4xl font-bold">{view.panelName}</h1>
        </div>
        <p className="text-lg font-semibold tabular-nums">
          {t("completedToday", { count: view.completedTodayCount })}
        </p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col gap-3">
          <h2 className="text-2xl font-bold">{t("today")}</h2>
          <div className="flex flex-col gap-3">
            {view.today.map((card) => (
              <TvCard key={card.id} card={card} />
            ))}
          </div>
        </section>
        <section className="flex min-h-0 flex-col gap-3">
          <h2 className="text-2xl font-bold">{nextHeading}</h2>
          <div className="flex flex-col gap-3">
            {view.tomorrow.map((card) => (
              <TvCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
