import type { ReactNode } from "react";

export function ListFiltersBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-4">{children}</div>
  );
}
