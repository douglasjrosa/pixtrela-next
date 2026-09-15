import type { ReactNode } from "react";

import {
  APP_SECTION_TABS_COMPACT_CLASS,
} from "@/components/layout/app-page-layout";
import { SectionTabs } from "@/components/navigation/section-tabs";
import type { StaffSectionTab } from "@/lib/auth/staff-sections";
import { cn } from "@/lib/utils";

export interface StaffSectionTabsBarProps {
  tabs: StaffSectionTab[];
  ariaLabel: string;
  className?: string;
  children: ReactNode;
}

export function StaffSectionTabsBar({
  tabs,
  ariaLabel,
  className,
  children,
}: StaffSectionTabsBarProps) {
  if (tabs.length <= 1) {
    return <>{children}</>;
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        className={
          "shrink-0 border-b px-6 pt-4 max-[500px]:px-3 max-[500px]:pt-3"
        }
      >
        <SectionTabs
          ariaLabel={ariaLabel}
          className={APP_SECTION_TABS_COMPACT_CLASS}
          items={tabs}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
