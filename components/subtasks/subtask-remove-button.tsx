"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export interface SubTaskRemoveButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function SubTaskRemoveButton({
  onClick,
  disabled = false,
}: SubTaskRemoveButtonProps) {
  const tSubtasks = useTranslations("subtasks");

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 shrink-0"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-label={tSubtasks("removeSubtask")}
    >
      <X className="size-4" aria-hidden />
    </Button>
  );
}
