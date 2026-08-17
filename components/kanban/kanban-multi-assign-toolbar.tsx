"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const MULTI_SELECT_SWITCH_ID = "kanban-multi-select-switch";

export interface KanbanMultiAssignSwitchProps {
  multiEnabled: boolean;
  disabled?: boolean;
  className?: string;
  onMultiEnabledChange: (enabled: boolean) => void;
}

export function KanbanMultiAssignSwitch({
  multiEnabled,
  disabled = false,
  className,
  onMultiEnabledChange,
}: KanbanMultiAssignSwitchProps) {
  const tKanban = useTranslations("kanban");

  return (
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      <Switch
        id={MULTI_SELECT_SWITCH_ID}
        checked={multiEnabled}
        disabled={disabled}
        onCheckedChange={onMultiEnabledChange}
        aria-label={tKanban("multiSelect")}
      />
      <Label htmlFor={MULTI_SELECT_SWITCH_ID} className="text-sm font-medium">
        {tKanban("multiSelect")}
      </Label>
    </div>
  );
}

export interface KanbanMultiAssignToolbarProps {
  multiEnabled: boolean;
  canApply: boolean;
  disabled?: boolean;
  showSwitch?: boolean;
  onMultiEnabledChange: (enabled: boolean) => void;
  onAssign: () => void;
  onRemove: () => void;
}

export function KanbanMultiAssignToolbar({
  multiEnabled,
  canApply,
  disabled = false,
  showSwitch = true,
  onMultiEnabledChange,
  onAssign,
  onRemove,
}: KanbanMultiAssignToolbarProps) {
  const tKanban = useTranslations("kanban");

  if (!showSwitch && !multiEnabled) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex w-full shrink-0 flex-wrap items-center gap-2",
        showSwitch ? "justify-between" : "justify-end",
      )}
    >
      {showSwitch ? (
        <KanbanMultiAssignSwitch
          multiEnabled={multiEnabled}
          disabled={disabled}
          onMultiEnabledChange={onMultiEnabledChange}
        />
      ) : null}

      {multiEnabled ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            disabled={disabled || !canApply}
            onClick={onRemove}
          >
            {tKanban("removeAssignments")}
          </Button>
          <Button
            type="button"
            disabled={disabled || !canApply}
            className={cn(
              "bg-emerald-600 text-white hover:bg-emerald-600/90",
              "focus-visible:border-emerald-600/40 focus-visible:ring-emerald-600/20",
            )}
            onClick={onAssign}
          >
            {tKanban("assignSubtasks")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
