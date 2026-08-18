"use client";

import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LoadMoreButtonProps
  extends Omit<ComponentProps<typeof Button>, "children" | "type" | "variant"> {
  label: string;
  loading?: boolean;
  loadingLabel: string;
}

export function LoadMoreButtonRow({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 justify-center pt-3">{children}</div>;
}

export function LoadMoreButton({
  label,
  loading = false,
  loadingLabel,
  disabled,
  className,
  ...props
}: LoadMoreButtonProps) {
  return (
    <Button
      type="button"
      variant="default"
      disabled={disabled || loading}
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary/80",
        className,
      )}
      {...props}
    >
      {loading ? loadingLabel : label}
    </Button>
  );
}
