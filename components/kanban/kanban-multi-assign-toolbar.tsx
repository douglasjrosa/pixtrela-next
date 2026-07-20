"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface KanbanMultiAssignToolbarProps {
  multiEnabled: boolean;
  canApply: boolean;
  disabled?: boolean;
  onMultiEnabledChange: (enabled: boolean) => void;
  onAssign: () => void;
  onRemove: () => void;
}

export function KanbanMultiAssignToolbar({
  multiEnabled,
  canApply,
  disabled = false,
  onMultiEnabledChange,
  onAssign,
  onRemove,
}: KanbanMultiAssignToolbarProps) {
  const tKanban = useTranslations("kanban");
  const switchId = "kanban-multi-select-switch";

  return (
    <div className="flex w-full shrink-0 flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Switch
          id={switchId}
          checked={multiEnabled}
          disabled={disabled}
          onCheckedChange={onMultiEnabledChange}
          aria-label={tKanban("multiSelect")}
        />
        <Label htmlFor={switchId} className="text-sm font-medium">
          {tKanban("multiSelect")}
        </Label>
      </div>

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
