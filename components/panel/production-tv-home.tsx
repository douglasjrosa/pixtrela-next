"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export type ProductionTvHomeItem = {
  name: string;
  slug: string;
  stepName: string;
};

export function ProductionTvHome({
  panels,
}: {
  panels: ProductionTvHomeItem[];
}) {
  const t = useTranslations("productionTv");

  return (
    <div className="flex min-h-dvh flex-col gap-6 p-6">
      <h1 className="font-display text-4xl font-bold">{t("homeTitle")}</h1>
      {panels.length === 0 ? (
        <p className="text-lg text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {panels.map((panel) => (
            <Link
              key={panel.slug}
              href={`/panel/${panel.slug}`}
              className={
                "flex min-h-28 flex-col justify-center rounded-2xl border-2 " +
                "border-[var(--star-gold)] bg-white p-6 text-left shadow-sm " +
                "transition hover:bg-[var(--star-gold-muted)]"
              }
              aria-label={t("open", { name: panel.name })}
            >
              <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {panel.stepName}
              </span>
              <span className="mt-1 text-2xl font-bold">{panel.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
