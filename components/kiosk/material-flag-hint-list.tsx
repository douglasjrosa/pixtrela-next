"use client";

import { useTranslations } from "next-intl";

import type { DependencyFlagHint } from "@/lib/business/subtask-queue";

export function MaterialFlagHintList({
  dependencyFlags,
  assignedFlagCodes,
  onRelease,
  releaseDisabled,
}: {
  dependencyFlags?: DependencyFlagHint[];
  assignedFlagCodes?: string[];
  onRelease?: () => void;
  releaseDisabled?: boolean;
}) {
  const t = useTranslations("kiosk");
  const hints = (dependencyFlags ?? []).filter((hint) => hint.codes.length > 0);
  const assigned = assignedFlagCodes ?? [];
  if (hints.length === 0 && assigned.length === 0) return null;

  return (
    <div className="space-y-2">
      {hints.map((hint) => (
        <p key={hint.predecessorName} className="text-sm text-muted-foreground">
          {t("dependencyFlags")}: {hint.predecessorName} ·{" "}
          {hint.codes.join(", ")}
        </p>
      ))}
      {assigned.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {assigned.map((code) => (
            <span
              key={code}
              className="rounded-full border bg-muted px-2 py-0.5 font-mono text-xs"
            >
              {code}
            </span>
          ))}
          {onRelease ? (
            <button
              type="button"
              className="text-sm underline"
              disabled={releaseDisabled}
              onClick={onRelease}
            >
              {t("releaseFlags")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
