"use client";

import { FlagTriangleRight } from "lucide-react";
import { useTranslations } from "next-intl";

import type { DependencyFlagHint } from "@/lib/business/subtask-queue";
import { cn } from "@/lib/utils";

function MaterialFlagBadge({
  code,
  children,
  className,
}: {
  code: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-muted px-2 py-0.5",
        className,
      )}
    >
      <FlagTriangleRight
        className="size-3.5 shrink-0 text-muted-foreground"
        aria-hidden
        strokeWidth={2}
      />
      <span className="font-mono text-sm font-bold">{code}</span>
      {children}
    </span>
  );
}

export function MaterialFlagHintList({
  dependencyFlags,
  assignedFlagCodes,
  onReleaseFlag,
  onReleaseAll,
  releaseDisabled,
  canReleaseFlags,
}: {
  dependencyFlags?: DependencyFlagHint[];
  assignedFlagCodes?: string[];
  onReleaseFlag?: (flagId: string) => void;
  /** Board: release every flag on the current sub-task. */
  onReleaseAll?: () => void;
  releaseDisabled?: boolean;
  /** Kiosk: pass false when the sub-task is not producing. */
  canReleaseFlags?: boolean;
}) {
  const t = useTranslations("kiosk");
  const hints = dependencyFlags ?? [];
  const assigned = assignedFlagCodes ?? [];
  const releaseAllowed =
    canReleaseFlags ?? Boolean(onReleaseFlag || onReleaseAll);
  const showRelease = releaseAllowed && !releaseDisabled;
  const hasHints = hints.some(
    (hint) => hint.semBandeira || hint.codes.length > 0,
  );
  if (!hasHints && assigned.length === 0) return null;

  return (
    <div className="space-y-2">
      {hints.map((hint) => {
        const key = hint.predecessorId ?? hint.predecessorName;
        if (hint.semBandeira) {
          return (
            <p key={key} className="text-sm text-muted-foreground">
              {t("dependencyFlags")}: {hint.predecessorName} ·{" "}
              <span className="rounded-full border bg-muted px-2 py-0.5 text-xs">
                {t("semBandeira")}
              </span>
            </p>
          );
        }
        if (hint.codes.length === 0) return null;
        const flagEntries =
          hint.flags && hint.flags.length > 0
            ? hint.flags
            : hint.codes.map((code) => ({ id: "", code }));
        return (
          <div key={key} className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t("dependencyFlags")}: {hint.predecessorName}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {flagEntries.map((flag) => (
                <MaterialFlagBadge key={flag.id || flag.code} code={flag.code}>
                  {showRelease && onReleaseFlag && flag.id ? (
                    <button
                      type="button"
                      className="ml-0.5 text-xs underline"
                      disabled={releaseDisabled}
                      onClick={() => onReleaseFlag(flag.id)}
                    >
                      {t("releaseFlag")}
                    </button>
                  ) : null}
                </MaterialFlagBadge>
              ))}
            </div>
          </div>
        );
      })}
      {assigned.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {assigned.map((code) => (
            <MaterialFlagBadge key={code} code={code} />
          ))}
          {showRelease && onReleaseAll ? (
            <button
              type="button"
              className="text-sm underline"
              disabled={releaseDisabled}
              onClick={onReleaseAll}
            >
              {t("releaseFlags")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
