import { getTranslations } from "next-intl/server";

import { buildLogListHref } from "@/lib/logs/log-list-params";
import type { LogActorOption } from "@/lib/repos/logs";
import type { LogListFilters } from "@/lib/schemas/log-list-filters";
import { LOG_ACTOR_FILTER_SYSTEM } from "@/lib/schemas/log-list-filters";

const FIELD_CLASS =
  "border-input bg-background h-10 rounded-md border px-3 text-sm";

export async function LogsFilterForm({
  filters,
  actors,
}: {
  filters: LogListFilters;
  actors: LogActorOption[];
}) {
  const t = await getTranslations("settings.logs");
  const clearHref = buildLogListHref({ direction: filters.direction });

  return (
    <form
      action="/settings/logs"
      className="flex flex-wrap items-end gap-2"
    >
      {filters.direction === "asc" ? (
        <input type="hidden" name="dir" value="asc" />
      ) : null}
      <label className="flex min-w-36 flex-col gap-1 text-sm">
        {t("filters.actor")}
        <select
          name="actor"
          defaultValue={filters.actor ?? ""}
          className={FIELD_CLASS}
        >
          <option value="">{t("allActors")}</option>
          <option value={LOG_ACTOR_FILTER_SYSTEM}>{t("system")}</option>
          {actors
            .filter((actor) => actor.id !== LOG_ACTOR_FILTER_SYSTEM)
            .map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.label}
              </option>
            ))}
        </select>
      </label>
      <label className="flex min-w-36 flex-col gap-1 text-sm">
        {t("filters.route")}
        <input
          name="route"
          defaultValue={filters.route ?? ""}
          className={FIELD_CLASS}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("filters.from")}
        <input
          type="date"
          name="from"
          defaultValue={filters.from ?? ""}
          className={FIELD_CLASS}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("filters.to")}
        <input
          type="date"
          name="to"
          defaultValue={filters.to ?? ""}
          className={FIELD_CLASS}
        />
      </label>
      <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm">
        {t("filters.text")}
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          className={FIELD_CLASS}
        />
      </label>
      <button
        type="submit"
        className="bg-primary text-primary-foreground h-10 rounded-md px-4 text-sm"
      >
        {t("applyFilters")}
      </button>
      <a href={clearHref} className="text-primary h-10 px-2 text-sm leading-10">
        {t("clearFilters")}
      </a>
    </form>
  );
}
