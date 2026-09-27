import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ListFiltersBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0 flex-wrap items-center gap-4", className)}>
      {children}
    </div>
  );
}
