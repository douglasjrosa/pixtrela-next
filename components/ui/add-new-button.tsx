"use client";

import type { ComponentProps } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AddNewButtonProps
  extends Omit<ComponentProps<typeof Button>, "children" | "size" | "variant"> {
  label: string;
}

export function AddNewButton({
  label,
  className,
  type = "button",
  ...props
}: AddNewButtonProps) {
  return (
    <Button
      type={type}
      size="icon-lg"
      className={cn(
        "size-10 font-display bg-foreground text-background",
        "hover:bg-foreground/90 [&_svg:not([class*='size-'])]:size-5",
        className,
      )}
      aria-label={label}
      {...props}
    >
      <Plus aria-hidden />
    </Button>
  );
}
