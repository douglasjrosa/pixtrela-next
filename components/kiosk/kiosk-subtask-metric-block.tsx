import type { ReactNode } from "react";

export interface KioskSubtaskMetricBlockProps {
  label: string;
  children: ReactNode;
}

export function KioskSubtaskMetricBlock({
  label,
  children,
}: KioskSubtaskMetricBlockProps) {
  return (
    <div className="space-y-0.5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-base tabular-nums text-foreground">{children}</div>
    </div>
  );
}
