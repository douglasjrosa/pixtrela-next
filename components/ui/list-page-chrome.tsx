import { Suspense, type ReactNode } from "react";

import { APP_LIST_PAGE_STACK_CLASS } from "@/components/layout/app-page-layout";

import { ListPageActionsProvider } from "./list-page-actions-slot";

export interface ListPageChromeProps {
  toolbar: ReactNode;
  children: ReactNode;
}

export function ListPageChrome({ toolbar, children }: ListPageChromeProps) {
  return (
    <ListPageActionsProvider>
      <div className={APP_LIST_PAGE_STACK_CLASS}>
        <Suspense fallback={null}>{toolbar}</Suspense>
        {children}
      </div>
    </ListPageActionsProvider>
  );
}
