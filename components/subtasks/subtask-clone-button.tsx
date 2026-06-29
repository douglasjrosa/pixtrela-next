"use client";

import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export interface SubTaskCloneButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function SubTaskCloneButton({
  onClick,
  disabled = false,
}: SubTaskCloneButtonProps) {
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
      aria-label={tSubtasks("cloneSubtask")}
    >
      <Copy className="size-4" aria-hidden />
    </Button>
  );
}
