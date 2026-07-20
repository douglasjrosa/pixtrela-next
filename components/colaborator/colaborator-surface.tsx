import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ColaboratorSurfaceProps {
  children: ReactNode;
  className?: string;
}

export function ColaboratorSurface({ children, className }: ColaboratorSurfaceProps) {
  return (
    <div className={cn("colaborator-surface flex min-h-dvh flex-col", className)}>
      {children}
    </div>
  );
}
