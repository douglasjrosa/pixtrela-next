"use client";

import type { ReactNode } from "react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PrintButtonProps = {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  title?: string;
  disabled?: boolean;
};

export function PrintButton({
  children,
  onClick,
  className,
  title,
  disabled,
}: PrintButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={cn("no-print gap-2 text-sm", className)}
    >
      <Printer className="size-4 shrink-0" aria-hidden />
      {children}
    </Button>
  );
}
