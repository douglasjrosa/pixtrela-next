"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const tCommon = useTranslations("common");

  return (
    <section className="mx-auto flex max-w-lg flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">{t("generic")}</h1>
      <Button type="button" variant="outline" onClick={reset}>
        {tCommon("retry")}
      </Button>
    </section>
  );
}
