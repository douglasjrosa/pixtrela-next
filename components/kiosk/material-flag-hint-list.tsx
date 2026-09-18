"use client";

import { useState } from "react";
import { FlagTriangleRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { DependencyFlagHint } from "@/lib/business/subtask-queue";
import { cn } from "@/lib/utils";

import { SemBandeiraInfoBadge } from "./sem-bandeira-info-badge";

const FLAG_BADGE_CLASS =
  "inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-1.5 " +
  "text-white shadow-sm";

function MaterialFlagBadge({
  code,
  onPress,
  disabled = false,
}: {
  code: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const content = (
    <>
      <FlagTriangleRight
        className="size-4 shrink-0 text-white/80"
        aria-hidden
        strokeWidth={2}
      />
      <span className="font-mono text-sm font-bold">{code}</span>
    </>
  );

  if (onPress) {
    return (
      <button
        type="button"
        disabled={disabled}
        className={cn(
          FLAG_BADGE_CLASS,
          "cursor-pointer transition-opacity hover:opacity-90",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        onClick={onPress}
      >
        {content}
      </button>
    );
  }

  return <span className={FLAG_BADGE_CLASS}>{content}</span>;
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
  const tCommon = useTranslations("common");
  const [pendingRelease, setPendingRelease] = useState<{
    id: string;
    code: string;
  } | null>(null);
  const hints = dependencyFlags ?? [];
  const assigned = assignedFlagCodes ?? [];
  const releaseAllowed =
    canReleaseFlags ?? Boolean(onReleaseFlag || onReleaseAll);
  const showRelease = releaseAllowed && !releaseDisabled;
  const hasHints = hints.some(
    (hint) => hint.semBandeira || hint.codes.length > 0,
  );
  if (!hasHints && assigned.length === 0) return null;

  function confirmRelease(): void {
    if (!pendingRelease || !onReleaseFlag) return;
    onReleaseFlag(pendingRelease.id);
    setPendingRelease(null);
  }

  return (
    <>
      <div className="space-y-2">
        {hints.map((hint) => {
          const key = hint.predecessorId ?? hint.predecessorName;
          if (hint.semBandeira) {
            return (
              <p
                key={key}
                className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
              >
                <span>
                  {t("dependencyFlags")}: {hint.predecessorName} ·
                </span>
                {hint.missingCategory ? (
                  <SemBandeiraInfoBadge />
                ) : (
                  <span className="rounded-md bg-slate-800 px-3 py-1.5 text-xs text-white">
                    {t("semBandeira")}
                  </span>
                )}
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
                  <MaterialFlagBadge
                    key={flag.id || flag.code}
                    code={flag.code}
                    disabled={releaseDisabled}
                    onPress={
                      showRelease && onReleaseFlag && flag.id
                        ? () => setPendingRelease({ id: flag.id, code: flag.code })
                        : undefined
                    }
                  />
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

      <ConfirmDialog
        open={pendingRelease !== null}
        title={
          pendingRelease
            ? t("releaseFlagConfirmTitle", { code: pendingRelease.code })
            : ""
        }
        description=""
        confirmLabel={tCommon("yes")}
        cancelLabel={tCommon("cancel")}
        confirmVariant="default"
        disabled={releaseDisabled}
        onConfirm={confirmRelease}
        onClose={() => setPendingRelease(null)}
      />
    </>
  );
}
