import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface AuthEntryTitleProps {
  children: ReactNode;
  className?: string;
}

/** Page title above login/kiosk entry cards. */
export function AuthEntryTitle({ children, className }: AuthEntryTitleProps) {
  return (
    <h1
      className={cn(
        "text-center text-2xl font-bold tracking-tight sm:text-3xl",
        className,
      )}
    >
      {children}
    </h1>
  );
}
