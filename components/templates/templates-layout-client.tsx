"use client";

import type { ReactNode } from "react";

import {
  APP_LIST_PAGE_CHROME_CLASS,
  APP_LIST_PAGE_HEADER_ROW_CLASS,
  APP_LIST_PAGE_SHELL_CLASS,
  APP_LIST_PAGE_TITLE_CLASS,
  APP_SECTION_TABS_COMPACT_CLASS,
} from "@/components/layout/app-page-layout";
import { SectionTabs } from "@/components/navigation/section-tabs";

import {
  TemplatesChromeActions,
  TemplatesPageActionsProvider,
} from "./templates-page-actions-context";

export interface TemplatesLayoutClientProps {
  title: string;
  tabsAriaLabel: string;
  tabItems: { href: string; label: string }[];
  children: ReactNode;
}

export function TemplatesLayoutClient({
  title,
  tabsAriaLabel,
  tabItems,
  children,
}: TemplatesLayoutClientProps) {
  return (
    <TemplatesPageActionsProvider>
      <div className={APP_LIST_PAGE_SHELL_CLASS}>
        <div className={APP_LIST_PAGE_CHROME_CLASS}>
          <div className={APP_LIST_PAGE_HEADER_ROW_CLASS}>
            <h1 className={APP_LIST_PAGE_TITLE_CLASS}>{title}</h1>
            <TemplatesChromeActions />
          </div>
          <SectionTabs
            ariaLabel={tabsAriaLabel}
            className={APP_SECTION_TABS_COMPACT_CLASS}
            items={tabItems}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </TemplatesPageActionsProvider>
  );
}
