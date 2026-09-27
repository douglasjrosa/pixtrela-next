"use client";

import type { ReactNode } from "react";

import { ListPageChrome } from "@/components/ui/list-page-chrome";
import type { ActivityFormOptions } from "@/lib/repos/activities";

import { ActivitiesPageHeader } from "./activities-page-header";
import { ActivitiesToolbar } from "./activities-toolbar";

export function ActivitiesPageChrome({
  options,
  children,
}: {
  options: ActivityFormOptions;
  children: ReactNode;
}) {
  return (
    <ListPageChrome
      toolbar={
        <ActivitiesToolbar
          trailingActions={<ActivitiesPageHeader options={options} />}
        />
      }
    >
      {children}
    </ListPageChrome>
  );
}
