"use client";

import type { ReactNode } from "react";

import { ListPageChrome } from "@/components/ui/list-page-chrome";

import { TemplatesToolbar } from "./templates-toolbar";

export function TemplatesListChrome({ children }: { children: ReactNode }) {
  return <ListPageChrome toolbar={<TemplatesToolbar />}>{children}</ListPageChrome>;
}
